import { GoogleGenAI, Type } from "@google/genai";
import fs from "fs";
import {
  getStoredDocument,
  createLocalSummaryAndInsights,
  StoredDocument,
} from "./documentStore";

export const SYSTEM_INSTRUCTION = `You are MindDocs AI, an AI assistant specialized in analyzing and discussing uploaded documents.

The uploaded document is the primary source of truth.

Answer the user's questions using information contained in the uploaded document whenever possible.

Do not fabricate facts, quotations, statistics, page numbers, sections, or claims that are not supported by the document.

If the requested information cannot be found in the uploaded document, clearly say:
'I couldn't find that information in the uploaded document.'

Do not pretend that information exists in the document when it does not.

You may:
Explain concepts in simpler language
Summarize sections
Compare concepts mentioned in the document
Create examples to explain concepts
Generate study questions
Generate notes
Explain difficult topics
Answer follow-up questions

When creating your own example, clearly indicate that it is an example and not necessarily content directly stated in the document.

Maintain conversation context and understand references such as 'it', 'they', 'the previous concept', 'the second one', etc.

Do not unnecessarily repeat the entire document.

Citation Rules:
- When answering questions, cite the specific document page or pages whenever identifiable page numbers, headers, footers, or slide numbers are present in the document.
- If identifiable page numbers are present and you can verify them with certainty, append at the end of your response on a new line in this exact format:
[SOURCES: Page X] or [SOURCES: Page X, Page Y]
- CRITICAL ANTI-HALLUCINATION RULE FOR CITATIONS: NEVER invent or guess page numbers. If the document has no clear page numbers or you cannot verify the exact page with certainty, DO NOT include the [SOURCES: ...] tag at all. Do not guess.`;

let aiClient: GoogleGenAI | null = null;
let currentApiKey: string | undefined;

export function isAuthError(err: any): boolean {
  const errStr = JSON.stringify(err?.message || err || "");
  const status = err?.status || err?.code || err?.error?.code;
  return (
    status === 401 ||
    errStr.includes("UNAUTHENTICATED") ||
    errStr.includes("ACCESS_TOKEN_TYPE_UNSUPPORTED") ||
    errStr.includes("invalid authentication credentials") ||
    errStr.includes("Expected OAuth 2 access token") ||
    errStr.includes("API_KEY_SERVICE_BLOCKED") ||
    errStr.includes("API_KEY_INVALID")
  );
}

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY environment variable is missing. Please set it in Settings > Secrets."
    );
  }

  if (!aiClient || currentApiKey !== apiKey) {
    currentApiKey = apiKey;
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function uploadPdfToGemini(
  filePath: string,
  originalName: string,
  mimeType: string = "application/pdf"
) {
  try {
    const ai = getGeminiClient();

    if (!fs.existsSync(filePath)) {
      throw new Error("Local file not found for upload");
    }

    const uploadedFile = await ai.files.upload({
      file: filePath,
      config: {
        displayName: originalName,
        mimeType: mimeType || "application/pdf",
      },
    });

    return uploadedFile;
  } catch (err: any) {
    console.warn(
      "Gemini Files API upload unavailable (FileService auth requirement). Will use inline data buffering:",
      err?.message || err
    );
    return null;
  }
}

export interface StructuredAnalysis {
  summary: string;
  keyTopics: string[];
  importantConcepts: string[];
  suggestedQuestions: string[];
}

function buildDocumentPart(docRef: string, storedDoc?: StoredDocument, mimeType: string = "application/pdf"): any {
  if (docRef.startsWith("https://") || (storedDoc && storedDoc.geminiFileUri)) {
    return {
      fileData: {
        fileUri: storedDoc?.geminiFileUri || docRef,
        mimeType: mimeType || "application/pdf",
      },
    };
  }

  if (storedDoc && storedDoc.buffer && storedDoc.buffer.length < 20 * 1024 * 1024) {
    return {
      inlineData: {
        mimeType: mimeType || "application/pdf",
        data: storedDoc.buffer.toString("base64"),
      },
    };
  }

  if (storedDoc && storedDoc.text) {
    return {
      text: `Document Content:\n\n${storedDoc.text.slice(0, 60000)}`,
    };
  }

  return {
    fileData: {
      fileUri: docRef,
      mimeType: mimeType || "application/pdf",
    },
  };
}

export async function analyzeDocumentWithGemini(
  fileUri: string,
  mimeType: string = "application/pdf"
): Promise<{ analysis: StructuredAnalysis; authWarning?: string }> {
  const storedDoc = getStoredDocument(fileUri);

  try {
    const ai = getGeminiClient();

    const prompt = `Analyze this uploaded document thoroughly and generate a structured executive overview.
Provide:
1. summary: A concise, informative summary capturing the document's main scope and key arguments (2 to 3 paragraphs).
2. keyTopics: A list of 4 to 8 main topics covered in the document.
3. importantConcepts: A list of 4 to 8 fundamental concepts, methodologies, or definitions introduced.
4. suggestedQuestions: A list of 3 to 5 insightful, high-value questions a user might ask about this specific document.`;

    const docPart = buildDocumentPart(fileUri, storedDoc, mimeType);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [docPart, prompt],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A comprehensive and concise summary of the document (2-3 paragraphs)",
            },
            keyTopics: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-8 central topics covered",
            },
            importantConcepts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "4-8 fundamental concepts, models, or methodologies",
            },
            suggestedQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3-5 high-value questions",
            },
          },
          required: ["summary", "keyTopics", "importantConcepts", "suggestedQuestions"],
        },
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    return {
      analysis: {
        summary: parsed.summary || "No summary available for this document.",
        keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics : [],
        importantConcepts: Array.isArray(parsed.importantConcepts) ? parsed.importantConcepts : [],
        suggestedQuestions: Array.isArray(parsed.suggestedQuestions) ? parsed.suggestedQuestions : [],
      },
    };
  } catch (err: any) {
    console.error("Gemini document analysis encountered error:", err?.message || err);

    if (storedDoc) {
      console.warn("Using local parsed text fallback due to Gemini error:", err?.message || err);
      const local = createLocalSummaryAndInsights(storedDoc.text || "", storedDoc.name);
      return {
        analysis: local,
        authWarning:
          isAuthError(err) || !process.env.GEMINI_API_KEY
            ? "Gemini API key is unauthenticated (401). Displaying extracted document content. Please verify your GEMINI_API_KEY in Settings > Secrets to unlock full conversational AI."
            : "Gemini AI is temporarily unavailable. Displaying local document overview.",
      };
    }

    throw err;
  }
}

export interface ChatHistoryEntry {
  role: "user" | "model";
  text: string;
}

export function parseAnswerAndSources(rawText: string): { answer: string; sources: number[] } {
  const sourceRegex = /\[SOURCES?:\s*([^\]]+)\]/i;
  const match = rawText.match(sourceRegex);
  let sources: number[] = [];
  let cleanedAnswer = rawText;

  if (match) {
    const sourceContent = match[1];
    const numbers = sourceContent.match(/\d+/g);
    if (numbers) {
      sources = Array.from(new Set(numbers.map(Number).filter((n) => !isNaN(n) && n > 0)));
    }
    cleanedAnswer = rawText.replace(sourceRegex, "").trim();
  }

  return { answer: cleanedAnswer, sources };
}

export async function askDocumentQuestion(
  fileUri: string,
  message: string,
  history: ChatHistoryEntry[] = [],
  mimeType: string = "application/pdf"
): Promise<{ answer: string; sources: number[] }> {
  const storedDoc = getStoredDocument(fileUri);

  try {
    const ai = getGeminiClient();

    // Limit conversation history to the last 20 messages
    const recentHistory = history.slice(-20);

    const docPart = buildDocumentPart(fileUri, storedDoc, mimeType);

    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text?: string; fileData?: any; inlineData?: any }>;
    }> = [];

    // Anchor turn: Document reference
    contents.push({
      role: "user",
      parts: [
        docPart,
        {
          text: "Here is the uploaded document for reference. Please review it and prepare to answer questions based strictly on its contents.",
        },
      ],
    });

    contents.push({
      role: "model",
      parts: [
        {
          text: "I have reviewed the uploaded document and understand its contents. I am ready to answer your questions strictly according to the facts and concepts presented in it.",
        },
      ],
    });

    // Append history
    for (const entry of recentHistory) {
      if (entry.text && entry.text.trim().length > 0) {
        contents.push({
          role: entry.role === "model" ? "model" : "user",
          parts: [{ text: entry.text }],
        });
      }
    }

    // Current user question
    contents.push({
      role: "user",
      parts: [{ text: message }],
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    const rawText = response.text || "I was unable to generate an answer for this question.";
    return parseAnswerAndSources(rawText);
  } catch (err: any) {
    console.error("Gemini askDocumentQuestion error:", err?.message || err);

    if (isAuthError(err) || !process.env.GEMINI_API_KEY) {
      if (storedDoc && storedDoc.text) {
        const keywords = message.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
        const paragraphs = storedDoc.text
          .split(/\n\s*\n/)
          .map((p) => p.replace(/\s+/g, " ").trim())
          .filter((p) => p.length > 30);

        const matches = paragraphs.filter((p) => {
          const lower = p.toLowerCase();
          return keywords.some((k) => lower.includes(k));
        });

        if (matches.length > 0) {
          return {
            answer: `**Relevant excerpt from "${storedDoc.name}":**\n\n> ${matches.slice(0, 2).join("\n\n> ")}\n\n---\n*💡 Note: Gemini AI is currently operating in local extraction mode (401 Unauthenticated). To enable full AI reasoning and dynamic answers, verify or update \`GEMINI_API_KEY\` in **Settings > Secrets**.*`,
            sources: [1],
          };
        }

        return {
          answer: `I could not locate an exact text match for "${message}" in the document.\n\n*💡 Note: Gemini AI is currently operating in local extraction mode (401 Unauthenticated). To enable full AI conversational Q&A, verify or update \`GEMINI_API_KEY\` in **Settings > Secrets**.*`,
          sources: [],
        };
      }
    }

    throw err;
  }
}

export async function handleFollowUpAction(
  fileUri: string,
  action: "simpler" | "example" | "deeper",
  history: ChatHistoryEntry[] = [],
  mimeType: string = "application/pdf"
): Promise<{ answer: string; sources: number[] }> {
  let prompt = "";

  switch (action) {
    case "simpler":
      prompt = `Please explain the concept discussed in your previous answer in simpler, more intuitive language ('Explain Like I'm 5'). Use clear, relatable analogies (clearly designated as illustrative examples) while remaining strictly grounded in the document facts.`;
      break;
    case "example":
      prompt = `Please provide a clear, illustrative, real-world example explaining the concept from your previous response. If the example is created to illustrate the idea and not explicitly stated in the document, clearly indicate that it is an illustrative example.`;
      break;
    case "deeper":
      prompt = `Please expand on your previous answer with greater technical depth, structural nuance, and thorough in-depth analysis, strictly prioritizing information from the uploaded document.`;
      break;
    default:
      prompt = `Please elaborate further on your previous response using facts from the document.`;
  }

  return askDocumentQuestion(fileUri, prompt, history, mimeType);
}

export async function runDocumentAction(
  fileUri: string,
  action: "notes" | "mcqs" | "simplify" | "important-questions",
  mimeType: string = "application/pdf"
): Promise<{ title: string; answer: string; sources: number[] }> {
  let actionPrompt = "";
  let title = "";

  switch (action) {
    case "notes":
      title = "Structured Notes & Key Takeaways";
      actionPrompt = `Create a set of comprehensive, structured study notes based on this document.
Organize into clear sections with headings, key takeaway bullet points, and core definitions. Focus strictly on the material in the document.`;
      break;
    case "mcqs":
      title = "Multiple-Choice Practice Questions";
      actionPrompt = `Generate 4 high-quality multiple-choice questions (MCQs) testing understanding of core topics in this document.
For each question:
- State the question clearly
- Provide 4 options (A, B, C, D)
- Specify the Correct Answer
- Give a brief Explanation citing the document facts`;
      break;
    case "simplify":
      title = "Beginner-Friendly Explanation";
      actionPrompt = `Identify the most complex or technical concepts in this document and explain them in simple, beginner-friendly language ("Explain Like I'm 5").
Use clear real-world analogies (clearly marked as examples) to make difficult terminology easy to understand.`;
      break;
    case "important-questions":
      title = "Important Questions & Answers";
      actionPrompt = `Generate 5 important high-yield exam or review questions based on the major concepts in this document.
Provide a clear, detailed model answer for each question directly grounded in the document.`;
      break;
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  const result = await askDocumentQuestion(fileUri, actionPrompt, [], mimeType);
  return { title, answer: result.answer, sources: result.sources };
}

export interface QuizQuestionSchema {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourcePages: number[];
  topic: string;
}

export async function generateQuizQuestions(
  fileUri: string,
  numberOfQuestions: number = 5,
  difficulty: "easy" | "medium" | "hard" = "medium",
  topic: string = "Entire Document",
  mimeType: string = "application/pdf"
): Promise<QuizQuestionSchema[]> {
  const storedDoc = getStoredDocument(fileUri);

  try {
    const ai = getGeminiClient();

    const prompt = `You are an expert examiner. Generate ${numberOfQuestions} high-quality, interactive multiple-choice quiz questions based strictly on the uploaded document.

Configuration:
- Number of Questions: ${numberOfQuestions}
- Difficulty Level: ${difficulty}
- Topic Focus: ${topic === "Entire Document" ? "Cover the entire document evenly" : topic}

Requirements for each question:
1. question: Clear, unambiguous question testing conceptual understanding or key document facts.
2. options: An array of exactly 4 distinct options (choices).
3. correctAnswer: An integer (0, 1, 2, or 3) representing the index of the single correct option.
4. explanation: A concise, informative explanation clarifying why this option is correct based strictly on the document.
5. sourcePages: An array of numbers indicating verifiable page numbers in the document where this information is found (e.g. [23]). If page numbers are not reliably identifiable in the document, return an empty array []. NEVER guess or fabricate page numbers.
6. topic: The specific topic or concept being tested.`;

    const docPart = buildDocumentPart(fileUri, storedDoc, mimeType);

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: [docPart, prompt],
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 options",
                  },
                  correctAnswer: {
                    type: Type.INTEGER,
                    description: "0-based index of correct option (0, 1, 2, or 3)",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Grounded explanation from the document",
                  },
                  sourcePages: {
                    type: Type.ARRAY,
                    items: { type: Type.INTEGER },
                    description: "Reliable page numbers if verifiable, otherwise empty array []",
                  },
                  topic: { type: Type.STRING },
                },
                required: [
                  "question",
                  "options",
                  "correctAnswer",
                  "explanation",
                  "sourcePages",
                  "topic",
                ],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    const text = response.text || "{}";
    const parsed = JSON.parse(text);
    const questionsRaw = Array.isArray(parsed.questions) ? parsed.questions : [];

    return questionsRaw.map((q: any, idx: number) => ({
      id: `q_${Date.now()}_${idx + 1}`,
      question: String(q.question || `Question ${idx + 1}`),
      options:
        Array.isArray(q.options) && q.options.length >= 2
          ? q.options.map(String)
          : ["True", "False"],
      correctAnswer:
        typeof q.correctAnswer === "number" &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < (q.options?.length || 4)
          ? q.correctAnswer
          : 0,
      explanation: String(q.explanation || "Refer to document details."),
      sourcePages: Array.isArray(q.sourcePages)
        ? q.sourcePages.map(Number).filter((n: number) => !isNaN(n) && n > 0)
        : [],
      topic: String(q.topic || (topic === "Entire Document" ? "General" : topic)),
    }));
  } catch (err: any) {
    console.error("Quiz generation error:", err?.message || err);

    if (storedDoc && (isAuthError(err) || !process.env.GEMINI_API_KEY)) {
      const insights = createLocalSummaryAndInsights(storedDoc.text, storedDoc.name);
      const fallbackQuestions: QuizQuestionSchema[] = [];

      for (let i = 0; i < Math.min(numberOfQuestions, insights.keyTopics.length); i++) {
        const t = insights.keyTopics[i];
        fallbackQuestions.push({
          id: `q_local_${Date.now()}_${i + 1}`,
          question: `Which of the following describes the key focus of "${t}" in ${storedDoc.name}?`,
          options: [
            `It represents a core concept discussed in the document.`,
            `It is entirely unrelated to the document.`,
            `It was rejected in the conclusion.`,
            `It contradicts the document findings.`,
          ],
          correctAnswer: 0,
          explanation: `"${t}" is identified as one of the primary sections or topics in the document.`,
          sourcePages: [1],
          topic: t,
        });
      }

      if (fallbackQuestions.length > 0) {
        return fallbackQuestions;
      }
    }

    throw err;
  }
}
