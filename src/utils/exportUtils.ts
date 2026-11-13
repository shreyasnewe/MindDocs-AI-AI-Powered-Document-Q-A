import { jsPDF } from "jspdf";
import { ChatMessageItem, DocumentMetadata, DocumentAnalysis, QuizQuestion } from "../types";

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").replace(/_+/g, "_").slice(0, 40);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// CONVERSATION EXPORT
// -------------------------------------------------------------

export function exportConversationToMarkdown(
  doc: DocumentMetadata,
  messages: ChatMessageItem[]
) {
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let md = `# MindDocs AI — Conversation Export\n\n`;
  md += `**Document:** ${doc.name}  \n`;
  md += `**Exported On:** ${dateStr}  \n`;
  md += `**Total Messages:** ${messages.length}  \n\n`;
  md += `---\n\n`;

  for (const m of messages) {
    const roleLabel = m.role === "user" ? "User Question" : "MindDocs AI";
    const time = new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    md += `### ${roleLabel} (${time})\n\n`;
    md += `${m.text}\n\n`;
    if (m.sources && m.sources.length > 0) {
      md += `*Source Citation: Page ${m.sources.join(", ")}*\n\n`;
    }
    md += `---\n\n`;
  }

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Conversation.md`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportConversationToTxt(
  doc: DocumentMetadata,
  messages: ChatMessageItem[]
) {
  const dateStr = new Date().toLocaleDateString();
  let txt = `====================================================\n`;
  txt += `MINDDOCS AI — CONVERSATION EXPORT\n`;
  txt += `Document: ${doc.name}\n`;
  txt += `Date: ${dateStr}\n`;
  txt += `Messages: ${messages.length}\n`;
  txt += `====================================================\n\n`;

  for (const m of messages) {
    const roleLabel = m.role === "user" ? "USER" : "MINDDOCS AI";
    txt += `[${roleLabel}]\n`;
    txt += `${m.text}\n`;
    if (m.sources && m.sources.length > 0) {
      txt += `(Source: Page ${m.sources.join(", ")})\n`;
    }
    txt += `\n----------------------------------------------------\n\n`;
  }

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Conversation.txt`;
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportConversationToPdf(
  doc: DocumentMetadata,
  messages: ChatMessageItem[]
) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  // Header Banner
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(30, 41, 59);
  pdf.text("MindDocs AI — Conversation Export", margin, y);
  y += 22;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Document: ${doc.name} | Exported: ${new Date().toLocaleDateString()}`, margin, y);
  y += 18;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  if (messages.length === 0) {
    pdf.setFontSize(12);
    pdf.setTextColor(148, 163, 184);
    pdf.text("No messages recorded in this conversation.", margin, y);
  }

  for (const m of messages) {
    const isUser = m.role === "user";
    const speaker = isUser ? "User" : "MindDocs AI";

    // Speaker Header
    if (y > pageHeight - 60) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(isUser ? 30 : 79, isUser ? 41 : 70, isUser ? 59 : 229); // dark stone or indigo
    pdf.text(speaker, margin, y);
    y += 14;

    // Body Text
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(51, 65, 85);

    // Clean simple markdown artifacts for clean PDF display
    const cleanText = m.text
      .replace(/###/g, "")
      .replace(/##/g, "")
      .replace(/#/g, "")
      .replace(/\*\*/g, "");

    const lines = pdf.splitTextToSize(cleanText, contentWidth);
    for (const line of lines) {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 13;
    }

    // Sources if any
    if (m.sources && m.sources.length > 0) {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(8.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`[Verified Source: Page ${m.sources.join(", ")}]`, margin, y);
      y += 14;
    }

    y += 10;
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 16;
  }

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Conversation.pdf`;
  pdf.save(filename);
}

// -------------------------------------------------------------
// NOTES & OVERVIEW EXPORT
// -------------------------------------------------------------

export function exportNotesToMarkdown(
  doc: DocumentMetadata,
  analysis: DocumentAnalysis,
  additionalNotes?: string
) {
  let md = `# MindDocs AI — Study Notes & Document Synthesis\n\n`;
  md += `**Document:** ${doc.name}  \n`;
  md += `**Date:** ${new Date().toLocaleDateString()}  \n\n`;

  md += `## Executive Summary\n\n${analysis.summary}\n\n`;

  md += `## Key Topics\n\n`;
  analysis.keyTopics.forEach((t) => {
    md += `- ${t}\n`;
  });
  md += `\n`;

  md += `## Important Concepts\n\n`;
  analysis.importantConcepts.forEach((c) => {
    md += `- ${c}\n`;
  });
  md += `\n`;

  if (additionalNotes) {
    md += `## Additional Generated Notes\n\n${additionalNotes}\n\n`;
  }

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Notes.md`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportNotesToTxt(
  doc: DocumentMetadata,
  analysis: DocumentAnalysis,
  additionalNotes?: string
) {
  let txt = `====================================================\n`;
  txt += `MINDDOCS AI — STUDY NOTES & OVERVIEW\n`;
  txt += `Document: ${doc.name}\n`;
  txt += `Date: ${new Date().toLocaleDateString()}\n`;
  txt += `====================================================\n\n`;

  txt += `[EXECUTIVE SUMMARY]\n${analysis.summary}\n\n`;

  txt += `[KEY TOPICS]\n`;
  analysis.keyTopics.forEach((t) => {
    txt += `• ${t}\n`;
  });
  txt += `\n`;

  txt += `[IMPORTANT CONCEPTS]\n`;
  analysis.importantConcepts.forEach((c) => {
    txt += `• ${c}\n`;
  });
  txt += `\n`;

  if (additionalNotes) {
    txt += `[ADDITIONAL GENERATED NOTES]\n${additionalNotes}\n\n`;
  }

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Notes.txt`;
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportNotesToPdf(
  doc: DocumentMetadata,
  analysis: DocumentAnalysis,
  additionalNotes?: string
) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(30, 41, 59);
  pdf.text("MindDocs AI — Study Notes", margin, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Document: ${doc.name} | Date: ${new Date().toLocaleDateString()}`, margin, y);
  y += 18;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  // Executive Summary
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Executive Summary", margin, y);
  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);
  const summaryLines = pdf.splitTextToSize(analysis.summary, contentWidth);
  for (const line of summaryLines) {
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += 13;
  }
  y += 14;

  // Key Topics
  if (y > pageHeight - 80) {
    pdf.addPage();
    y = margin;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Key Topics", margin, y);
  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);
  analysis.keyTopics.forEach((t) => {
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(`•  ${t}`, margin, y);
    y += 13;
  });
  y += 14;

  // Important Concepts
  if (y > pageHeight - 80) {
    pdf.addPage();
    y = margin;
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(30, 41, 59);
  pdf.text("Important Concepts", margin, y);
  y += 14;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(51, 65, 85);
  analysis.importantConcepts.forEach((c) => {
    if (y > pageHeight - 30) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(`•  ${c}`, margin, y);
    y += 13;
  });
  y += 14;

  if (additionalNotes) {
    if (y > pageHeight - 80) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12);
    pdf.setTextColor(30, 41, 59);
    pdf.text("Generated Notes", margin, y);
    y += 14;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(51, 65, 85);
    const cleanNotes = additionalNotes.replace(/###/g, "").replace(/##/g, "").replace(/\*\*/g, "");
    const noteLines = pdf.splitTextToSize(cleanNotes, contentWidth);
    for (const line of noteLines) {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 13;
    }
  }

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Notes.pdf`;
  pdf.save(filename);
}

// -------------------------------------------------------------
// QUIZ EXPORT
// -------------------------------------------------------------

export function exportQuizToMarkdown(
  doc: DocumentMetadata,
  questions: QuizQuestion[],
  userAnswers?: Record<number, number>
) {
  let md = `# MindDocs AI — Interactive Quiz Review\n\n`;
  md += `**Document:** ${doc.name}  \n`;
  md += `**Questions:** ${questions.length}  \n`;
  md += `**Date:** ${new Date().toLocaleDateString()}  \n\n`;
  md += `---\n\n`;

  questions.forEach((q, idx) => {
    md += `### Q${idx + 1}. ${q.question}\n\n`;
    if (q.topic) {
      md += `*Topic: ${q.topic}*\n\n`;
    }
    q.options.forEach((opt, optIdx) => {
      const isCorrect = optIdx === q.correctAnswer;
      const wasSelected = userAnswers && userAnswers[idx] === optIdx;
      const marker = wasSelected ? (isCorrect ? "[x] (Your Answer - Correct)" : "[x] (Your Answer - Incorrect)") : (isCorrect ? "[ ] (Correct Answer)" : "[ ]");
      md += `${marker} ${String.fromCharCode(65 + optIdx)}. ${opt}\n`;
    });
    md += `\n**Explanation:** ${q.explanation}\n`;
    if (q.sourcePages && q.sourcePages.length > 0) {
      md += `**Source Citation:** Page ${q.sourcePages.join(", ")}\n`;
    }
    md += `\n---\n\n`;
  });

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Quiz.md`;
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportQuizToTxt(
  doc: DocumentMetadata,
  questions: QuizQuestion[],
  userAnswers?: Record<number, number>
) {
  let txt = `====================================================\n`;
  txt += `MINDDOCS AI — QUIZ REVIEW\n`;
  txt += `Document: ${doc.name}\n`;
  txt += `Questions: ${questions.length}\n`;
  txt += `Date: ${new Date().toLocaleDateString()}\n`;
  txt += `====================================================\n\n`;

  questions.forEach((q, idx) => {
    txt += `Q${idx + 1}: ${q.question} [${q.topic || "General"}]\n`;
    q.options.forEach((opt, optIdx) => {
      const letter = String.fromCharCode(65 + optIdx);
      const isCorrect = optIdx === q.correctAnswer;
      const isSelected = userAnswers && userAnswers[idx] === optIdx;
      txt += `  (${letter}) ${opt} ${isCorrect ? "[CORRECT]" : ""} ${isSelected ? "[YOUR CHOICE]" : ""}\n`;
    });
    txt += `Explanation: ${q.explanation}\n`;
    if (q.sourcePages && q.sourcePages.length > 0) {
      txt += `Source: Page ${q.sourcePages.join(", ")}\n`;
    }
    txt += `\n----------------------------------------------------\n\n`;
  });

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Quiz.txt`;
  const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
  triggerDownload(blob, filename);
}

export function exportQuizToPdf(
  doc: DocumentMetadata,
  questions: QuizQuestion[],
  userAnswers?: Record<number, number>
) {
  const pdf = new jsPDF({ unit: "pt", format: "letter" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(30, 41, 59);
  pdf.text("MindDocs AI — Quiz Review", margin, y);
  y += 20;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Document: ${doc.name} | Total Questions: ${questions.length}`, margin, y);
  y += 18;

  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 20;

  questions.forEach((q, idx) => {
    if (y > pageHeight - 100) {
      pdf.addPage();
      y = margin;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10.5);
    pdf.setTextColor(30, 41, 59);
    const qLines = pdf.splitTextToSize(`Q${idx + 1}. ${q.question}`, contentWidth);
    for (const line of qLines) {
      if (y > pageHeight - 40) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(line, margin, y);
      y += 14;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    q.options.forEach((opt, optIdx) => {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = margin;
      }
      const letter = String.fromCharCode(65 + optIdx);
      const isCorrect = optIdx === q.correctAnswer;
      const isSelected = userAnswers && userAnswers[idx] === optIdx;

      let suffix = "";
      if (isCorrect) suffix += " ✓ (Correct)";
      if (isSelected && !isCorrect) suffix += " ✗ (Your Answer)";

      pdf.setTextColor(isCorrect ? 16 : isSelected ? 220 : 71, isCorrect ? 185 : isSelected ? 38 : 85, isCorrect ? 129 : isSelected ? 38 : 105);
      pdf.text(`    ${letter}. ${opt}${suffix}`, margin, y);
      y += 13;
    });

    // Explanation
    if (y > pageHeight - 40) {
      pdf.addPage();
      y = margin;
    }
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8.5);
    pdf.setTextColor(100, 116, 139);
    const expLines = pdf.splitTextToSize(`Explanation: ${q.explanation}`, contentWidth - 20);
    for (const exp of expLines) {
      if (y > pageHeight - 30) {
        pdf.addPage();
        y = margin;
      }
      pdf.text(exp, margin + 10, y);
      y += 12;
    }

    if (q.sourcePages && q.sourcePages.length > 0) {
      pdf.text(`[Source: Page ${q.sourcePages.join(", ")}]`, margin + 10, y);
      y += 12;
    }

    y += 10;
    pdf.setDrawColor(241, 245, 249);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 14;
  });

  const filename = `MindDocs-${sanitizeFilename(doc.name)}-Quiz.pdf`;
  pdf.save(filename);
}
