import { PDFParse } from "pdf-parse";

export interface StoredDocument {
  id: string;
  name: string;
  mimeType: string;
  size: string;
  sizeBytes: number;
  buffer: Buffer;
  text: string;
  numPages: number;
  geminiFileUri?: string;
  createdAt: number;
}

// In-memory document storage indexed by doc ID and geminiFileUri
const docsById = new Map<string, StoredDocument>();
const docsByUri = new Map<string, StoredDocument>();

const MAX_STORE_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

function cleanOldDocuments() {
  const now = Date.now();
  for (const [id, doc] of docsById.entries()) {
    if (now - doc.createdAt > MAX_STORE_AGE_MS) {
      docsById.delete(id);
      if (doc.geminiFileUri) {
        docsByUri.delete(doc.geminiFileUri);
      }
    }
  }
}

export function saveStoredDocument(doc: StoredDocument): void {
  cleanOldDocuments();
  docsById.set(doc.id, doc);
  if (doc.geminiFileUri) {
    docsByUri.set(doc.geminiFileUri, doc);
  }
}

export function getStoredDocument(ref: string): StoredDocument | undefined {
  if (!ref) return undefined;
  return docsById.get(ref) || docsByUri.get(ref);
}

export async function parsePdfContent(buffer: Buffer): Promise<{ text: string; numPages: number }> {
  try {
    const parser = new PDFParse({ data: buffer });
    const textResult = await parser.getText();
    return {
      text: typeof textResult?.text === "string" ? textResult.text.trim() : "",
      numPages: Number(textResult?.total) || 1,
    };
  } catch (err) {
    console.warn("PDF text parsing warning:", err);
    return { text: "", numPages: 1 };
  }
}

export function createLocalSummaryAndInsights(
  text: string,
  fileName: string
): {
  summary: string;
  keyTopics: string[];
  importantConcepts: string[];
  suggestedQuestions: string[];
} {
  if (!text || text.trim().length === 0) {
    return {
      summary: `Document "${fileName}" was successfully uploaded. Text extraction found minimal or image-only content. Configure a valid GEMINI_API_KEY in Settings > Secrets to unlock full multimodal AI reasoning.`,
      keyTopics: ["Document Overview", "Uploaded File", "Content Analysis"],
      importantConcepts: ["File Processing", "Document Structure"],
      suggestedQuestions: [
        "What is the main subject of this document?",
        "Can you summarize the available content?",
        "What sections are contained in this file?",
      ],
    };
  }

  // Split into paragraphs / lines
  const rawParagraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40);

  let summary = "";
  if (rawParagraphs.length > 0) {
    const selected = rawParagraphs.slice(0, 3).join("\n\n");
    summary = selected.length > 800 ? `${selected.slice(0, 797)}...` : selected;
  } else {
    summary = text.slice(0, 500).replace(/\s+/g, " ").trim() + "...";
  }

  // Extract candidate topic headings or prominent lines
  const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 3 && l.length < 60);
  const candidateTopics: string[] = [];
  const candidateConcepts: string[] = [];

  for (const line of lines) {
    // Looks like a section header or bullet point
    if (/^[0-9]+(\.[0-9]+)*\s+[A-Z]/.test(line) || /^[A-Z][A-Za-z0-9\s,–—:-]{4,45}$/.test(line)) {
      if (!candidateTopics.includes(line) && candidateTopics.length < 6) {
        candidateTopics.push(line);
      }
    }
  }

  if (candidateTopics.length === 0) {
    candidateTopics.push("Document Structure", "Core Topics", "Section Overview", "Key Findings");
  }

  // Extract concepts (words with definitions or capitalized keywords)
  const conceptMatches = text.match(/\b([A-Z][a-z]{3,}\s+[A-Z][a-z]{3,})\b/g) || [];
  for (const match of conceptMatches) {
    if (!candidateConcepts.includes(match) && match.length < 35 && candidateConcepts.length < 6) {
      candidateConcepts.push(match);
    }
  }

  if (candidateConcepts.length === 0) {
    candidateConcepts.push("Core Methodology", "Analysis & Discussion", "Summary Details");
  }

  const suggestedQuestions = [
    `What are the primary findings in ${fileName}?`,
    `Can you explain the main points of "${candidateTopics[0] || "this document"}"?`,
    "What conclusions or next steps are described?",
    "Can you provide a step-by-step breakdown of the main concepts?",
  ];

  return {
    summary,
    keyTopics: candidateTopics,
    importantConcepts: candidateConcepts,
    suggestedQuestions,
  };
}
