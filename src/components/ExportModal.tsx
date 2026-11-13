import React, { useState } from "react";
import { Download, FileText, MessageSquare, BookOpen, Award, X, Check } from "lucide-react";
import { DocumentMetadata, DocumentAnalysis, ChatMessageItem, QuizQuestion, ExportFormat, ExportTarget } from "../types";
import {
  exportConversationToPdf,
  exportConversationToMarkdown,
  exportConversationToTxt,
  exportNotesToPdf,
  exportNotesToMarkdown,
  exportNotesToTxt,
  exportQuizToPdf,
  exportQuizToMarkdown,
  exportQuizToTxt,
} from "../utils/exportUtils";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentMetadata | null;
  analysis: DocumentAnalysis | null;
  messages: ChatMessageItem[];
  quizQuestions?: QuizQuestion[] | null;
  quizUserAnswers?: Record<number, number>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  document: doc,
  analysis,
  messages,
  quizQuestions,
  quizUserAnswers,
}) => {
  const [target, setTarget] = useState<ExportTarget>("conversation");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen || !doc) return null;

  const hasQuiz = quizQuestions && quizQuestions.length > 0;

  const handleExport = () => {
    setIsExporting(true);
    setExportSuccess(false);

    try {
      if (target === "conversation") {
        if (format === "pdf") exportConversationToPdf(doc, messages);
        else if (format === "markdown") exportConversationToMarkdown(doc, messages);
        else exportConversationToTxt(doc, messages);
      } else if (target === "notes") {
        if (!analysis) return;
        // Search for generated notes in messages if any
        const notesMsg = messages.find((m) => m.text.includes("Structured Notes & Key Takeaways"));
        const additionalNotes = notesMsg ? notesMsg.text : undefined;

        if (format === "pdf") exportNotesToPdf(doc, analysis, additionalNotes);
        else if (format === "markdown") exportNotesToMarkdown(doc, analysis, additionalNotes);
        else exportNotesToTxt(doc, analysis, additionalNotes);
      } else if (target === "quiz") {
        if (!quizQuestions) return;
        if (format === "pdf") exportQuizToPdf(doc, quizQuestions, quizUserAnswers);
        else if (format === "markdown") exportQuizToMarkdown(doc, quizQuestions, quizUserAnswers);
        else exportQuizToTxt(doc, quizQuestions, quizUserAnswers);
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-stone-200/80 animate-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Download className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-900">Export Document Data</h3>
            <p className="text-xs text-stone-500">Download formatted files with verified citations</p>
          </div>
        </div>

        {/* Export Target Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Select What to Export
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Conversation */}
              <button
                type="button"
                onClick={() => setTarget("conversation")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  target === "conversation"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600"
                    : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                }`}
              >
                <MessageSquare className="h-4 w-4 mb-1 text-indigo-600" />
                <span className="text-xs font-semibold">Conversation</span>
                <span className="text-[10px] text-stone-500 mt-0.5">{messages.length} messages</span>
              </button>

              {/* Notes */}
              <button
                type="button"
                onClick={() => setTarget("notes")}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  target === "notes"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600"
                    : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                }`}
              >
                <BookOpen className="h-4 w-4 mb-1 text-amber-600" />
                <span className="text-xs font-semibold">Study Notes</span>
                <span className="text-[10px] text-stone-500 mt-0.5">Summary & Concepts</span>
              </button>

              {/* Quiz */}
              <button
                type="button"
                onClick={() => setTarget("quiz")}
                disabled={!hasQuiz}
                className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
                  !hasQuiz
                    ? "opacity-50 cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
                    : target === "quiz"
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-600"
                    : "border-stone-200 hover:border-stone-300 text-stone-700 bg-white"
                }`}
              >
                <Award className="h-4 w-4 mb-1 text-emerald-600" />
                <span className="text-xs font-semibold">Quiz Review</span>
                <span className="text-[10px] text-stone-500 mt-0.5">
                  {hasQuiz ? `${quizQuestions!.length} questions` : "Not generated yet"}
                </span>
              </button>
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Select Format
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  format === "pdf"
                    ? "border-indigo-600 bg-indigo-600 text-white font-semibold shadow-xs"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                PDF Document
              </button>

              <button
                type="button"
                onClick={() => setFormat("markdown")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  format === "markdown"
                    ? "border-indigo-600 bg-indigo-600 text-white font-semibold shadow-xs"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                Markdown (.md)
              </button>

              <button
                type="button"
                onClick={() => setFormat("txt")}
                className={`py-2 px-3 rounded-xl border text-xs font-medium transition-all ${
                  format === "txt"
                    ? "border-indigo-600 bg-indigo-600 text-white font-semibold shadow-xs"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                }`}
              >
                Plain Text (.txt)
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2 pt-4 border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {exportSuccess ? (
              <>
                <Check className="h-4 w-4" />
                <span>Downloaded!</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download {format.toUpperCase()}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
