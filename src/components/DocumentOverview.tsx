import React, { useState } from "react";
import {
  FileCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  BookOpen,
  FileQuestion,
  Lightbulb,
  Compass,
} from "lucide-react";
import { DocumentAnalysis, ActionType } from "../types";

interface DocumentOverviewProps {
  analysis: DocumentAnalysis;
  onSelectSuggestedQuestion: (question: string) => void;
  onExecuteAction: (action: ActionType) => void;
  onOpenQuiz?: () => void;
  isActionLoading: boolean;
}

export const DocumentOverview: React.FC<DocumentOverviewProps> = ({
  analysis,
  onSelectSuggestedQuestion,
  onExecuteAction,
  onOpenQuiz,
  isActionLoading,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs mb-6 transition-all duration-200">
      {/* Header with collapse/expand */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2">
          <FileCheck className="h-4 w-4 text-indigo-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800">
            Document Overview
          </h3>
        </div>
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-800 transition-colors p-1"
        >
          <span>{isExpanded ? "Collapse" : "Expand"}</span>
          {isExpanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 space-y-5 text-stone-700">
          {/* Summary */}
          <div>
            <h4 className="text-xs font-semibold text-stone-900 mb-1.5 flex items-center gap-1.5">
              <span>Summary</span>
            </h4>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
              {analysis.summary}
            </p>
          </div>

          {/* Key Topics & Important Concepts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Key Topics */}
            <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-100">
              <h4 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                Key Topics
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-600">
                {analysis.keyTopics && analysis.keyTopics.length > 0 ? (
                  analysis.keyTopics.map((topic, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span className="leading-snug">{topic}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-400">No key topics extracted</li>
                )}
              </ul>
            </div>

            {/* Important Concepts */}
            <div className="rounded-xl bg-stone-50 p-3.5 border border-stone-100">
              <h4 className="text-xs font-semibold text-stone-900 mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                Important Concepts
              </h4>
              <ul className="space-y-1.5 text-xs text-stone-600">
                {analysis.importantConcepts && analysis.importantConcepts.length > 0 ? (
                  analysis.importantConcepts.map((concept, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold">•</span>
                      <span className="leading-snug">{concept}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-stone-400">No concepts identified</li>
                )}
              </ul>
            </div>
          </div>

          {/* Quick Auxiliary Action Buttons */}
          <div className="pt-2 border-t border-stone-100">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2">
              Quick Actions
            </h4>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onExecuteAction("notes")}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-colors shadow-2xs disabled:opacity-50"
              >
                <BookOpen className="h-3.5 w-3.5 text-indigo-600" />
                <span>Generate Notes</span>
              </button>

              <button
                type="button"
                onClick={() => onExecuteAction("mcqs")}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-colors shadow-2xs disabled:opacity-50"
              >
                <FileQuestion className="h-3.5 w-3.5 text-indigo-600" />
                <span>Generate MCQs</span>
              </button>

              {onOpenQuiz && (
                <button
                  type="button"
                  onClick={onOpenQuiz}
                  disabled={isActionLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-800 hover:bg-indigo-100 hover:border-indigo-300 transition-colors shadow-2xs disabled:opacity-50"
                  title="Launch full Interactive Quiz Mode"
                >
                  <HelpCircle className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Interactive Quiz</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onExecuteAction("simplify")}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-colors shadow-2xs disabled:opacity-50"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                <span>Explain Simply</span>
              </button>

              <button
                type="button"
                onClick={() => onExecuteAction("important-questions")}
                disabled={isActionLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50 hover:text-stone-900 hover:border-stone-300 transition-colors shadow-2xs disabled:opacity-50"
              >
                <Compass className="h-3.5 w-3.5 text-emerald-600" />
                <span>Important Questions</span>
              </button>
            </div>
          </div>

          {/* Suggested Questions */}
          {analysis.suggestedQuestions && analysis.suggestedQuestions.length > 0 && (
            <div className="pt-2 border-t border-stone-100">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 mb-2 flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-stone-400" />
                Suggested Questions
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.suggestedQuestions.map((question, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelectSuggestedQuestion(question)}
                    disabled={isActionLoading}
                    className="inline-flex items-center gap-1.5 rounded-full border border-stone-200/90 bg-stone-50/80 px-3.5 py-1.5 text-xs text-stone-700 hover:border-indigo-300 hover:bg-indigo-50/70 hover:text-indigo-900 transition-all text-left shadow-2xs"
                  >
                    <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                    <span>{question}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
