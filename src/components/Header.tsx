import React from "react";
import { FileText, History, Trash2, PlusCircle, HelpCircle, Download } from "lucide-react";
import { DocumentMetadata } from "../types";

interface HeaderProps {
  currentDocument: DocumentMetadata | null;
  messageCount: number;
  historyCount: number;
  onOpenHistory: () => void;
  onOpenClearModal: () => void;
  onOpenNewDocModal: () => void;
  onOpenQuiz?: () => void;
  onOpenExport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDocument,
  messageCount,
  historyCount,
  onOpenHistory,
  onOpenClearModal,
  onOpenNewDocModal,
  onOpenQuiz,
  onOpenExport,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-stone-200/80 bg-white/85 backdrop-blur-md transition-all duration-200">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-3 sm:px-6">
        {/* Left Branding & Active Document */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex items-center flex-shrink-0">
            <span className="font-bold text-base sm:text-lg tracking-tight text-stone-900">
              MindDocs AI
            </span>
          </div>

          {currentDocument && (
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 sm:pl-3 ml-1 sm:ml-2 border-l border-stone-200 min-w-0">
              <div
                className="flex items-center gap-1.5 rounded-lg bg-stone-100/90 px-2 sm:px-2.5 py-1 text-xs font-medium text-stone-800 border border-stone-200/60 truncate max-w-[140px] sm:max-w-[280px]"
                title={currentDocument.name}
              >
                <FileText className="h-3.5 w-3.5 text-stone-500 flex-shrink-0" />
                <span className="truncate">{currentDocument.name}</span>
              </div>

              <button
                type="button"
                onClick={onOpenNewDocModal}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                title="Start a new document session"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">New Document</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Top Bar Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quiz Mode Button (if active document) */}
          {currentDocument && onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200/90 bg-indigo-50/70 hover:bg-indigo-100 px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-2xs transition-colors"
              title="Practice with an interactive multiple-choice quiz"
            >
              <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Quiz Mode</span>
            </button>
          )}

          {/* Export Button (if active document) */}
          {currentDocument && onOpenExport && (
            <button
              type="button"
              onClick={onOpenExport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50 hover:text-stone-900 transition-colors"
              title="Export Conversation, Notes, or Quiz as PDF, Markdown, or TXT"
            >
              <Download className="h-3.5 w-3.5 text-stone-600" />
              <span className="hidden md:inline">Export</span>
            </button>
          )}

          {/* Chat History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-medium text-stone-700 shadow-xs hover:bg-stone-50 hover:text-stone-900 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-stone-500" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="rounded-full bg-stone-100 px-1.5 py-0.2 text-[10px] font-semibold text-stone-600">
                {historyCount}
              </span>
            )}
          </button>

          {/* Clear Conversation Button (only active if document is loaded) */}
          {currentDocument && (
            <button
              type="button"
              onClick={onOpenClearModal}
              disabled={messageCount === 0}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 sm:px-3 py-1.5 text-xs font-medium transition-colors ${
                messageCount > 0
                  ? "border-stone-200 bg-white text-stone-700 hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                  : "border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed"
              }`}
              title="Clear all messages in the current conversation"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">Clear</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
