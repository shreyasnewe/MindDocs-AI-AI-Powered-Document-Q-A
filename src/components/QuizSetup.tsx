import React, { useState } from "react";
import { HelpCircle, Sparkles, X, Loader2, ArrowRight } from "lucide-react";
import { DocumentMetadata, DocumentAnalysis, QuizSetupConfig } from "../types";

interface QuizSetupProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentMetadata | null;
  analysis: DocumentAnalysis | null;
  onStartQuiz: (config: QuizSetupConfig) => void;
  isLoading: boolean;
}

export const QuizSetup: React.FC<QuizSetupProps> = ({
  isOpen,
  onClose,
  document: doc,
  analysis,
  onStartQuiz,
  isLoading,
}) => {
  const [numberOfQuestions, setNumberOfQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [topic, setTopic] = useState<string>("Entire Document");

  if (!isOpen || !doc) return null;

  const topicsList = ["Entire Document", ...(analysis?.keyTopics || [])];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStartQuiz({
      numberOfQuestions,
      difficulty,
      topic,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-stone-200/80 animate-in zoom-in-95 duration-150">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute right-4 top-4 p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-stone-900">Interactive Quiz Mode</h3>
            <p className="text-xs text-stone-500 truncate max-w-xs sm:max-w-sm">
              Practice and test your understanding of {doc.name}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Question Count */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Number of Questions
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setNumberOfQuestions(count)}
                  disabled={isLoading}
                  className={`py-2 rounded-xl border text-xs font-semibold transition-all ${
                    numberOfQuestions === count
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  disabled={isLoading}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                    difficulty === lvl
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-stone-200 bg-stone-50 text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Focus */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-600 mb-2">
              Topic Focus
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-xl border border-stone-200 bg-stone-50 p-2.5 text-xs text-stone-800 focus:border-indigo-500 focus:bg-white focus:outline-hidden"
            >
              {topicsList.map((t, idx) => (
                <option key={idx} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="rounded-xl px-4 py-2 text-xs font-medium text-stone-600 hover:bg-stone-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating Quiz with Gemini...</span>
                </>
              ) : (
                <>
                  <span>Start Quiz</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
