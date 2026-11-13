import React, { useState } from "react";
import { Award, CheckCircle2, XCircle, RotateCcw, Download, ArrowLeft, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { QuizQuestion, DocumentMetadata } from "../types";
import { Citation } from "./Citation";

interface QuizResultsProps {
  document: DocumentMetadata;
  questions: QuizQuestion[];
  userAnswers: Record<number, number>;
  onRetakeQuiz: () => void;
  onExitQuiz: () => void;
  onOpenExport: () => void;
}

export const QuizResults: React.FC<QuizResultsProps> = ({
  document: doc,
  questions,
  userAnswers,
  onRetakeQuiz,
  onExitQuiz,
  onOpenExport,
}) => {
  const [showReview, setShowReview] = useState(false);

  // Compute total score purely in JavaScript
  const correctCount = questions.filter((q, idx) => userAnswers[idx] === q.correctAnswer).length;
  const totalCount = questions.length;
  const percentage = Math.round((correctCount / totalCount) * 100);

  // Determine missed topics
  const missedQuestions = questions.filter((q, idx) => userAnswers[idx] !== q.correctAnswer);
  const missedTopics = Array.from(
    new Set(missedQuestions.map((q) => q.topic).filter(Boolean))
  );

  let performanceTier = {
    title: "Needs Review",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    desc: "Consider reviewing the document sections and retaking the quiz to strengthen your understanding.",
  };

  if (percentage >= 80) {
    performanceTier = {
      title: "Excellent Mastery",
      color: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      desc: "Outstanding comprehension! You have demonstrated thorough understanding of the document.",
    };
  } else if (percentage >= 60) {
    performanceTier = {
      title: "Good Comprehension",
      color: "text-indigo-700",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
      desc: "Solid grasp of core concepts with a few specific topics that could benefit from quick review.",
    };
  }

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 animate-in fade-in duration-200">
      {/* Score Summary Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-4">
          <Award className="h-8 w-8" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight text-stone-900">Quiz Completed</h2>
        <p className="text-xs text-stone-500 mt-1">Based on {doc.name}</p>

        {/* Score Pill */}
        <div className="mt-6 inline-flex flex-col items-center justify-center rounded-2xl bg-stone-50 border border-stone-100 px-8 py-4">
          <span className="text-4xl sm:text-5xl font-extrabold text-stone-900">
            {correctCount} <span className="text-xl font-normal text-stone-400">/ {totalCount}</span>
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider mt-1.5 px-2.5 py-0.5 rounded-full border ${performanceTier.bg} ${performanceTier.color} ${performanceTier.border}`}>
            {percentage}% — {performanceTier.title}
          </span>
        </div>

        <p className="text-xs text-stone-600 max-w-md mx-auto mt-4 leading-relaxed">
          {performanceTier.desc}
        </p>

        {/* Topics to Review if any were missed */}
        {missedTopics.length > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-stone-50 border border-stone-200/70 text-left">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-700 mb-2">
              Topics to Review:
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {missedTopics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-lg bg-white border border-stone-200 px-2.5 py-1 text-xs text-stone-800 shadow-2xs font-medium"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onRetakeQuiz}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-xs transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Retake Quiz</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-50 hover:text-stone-900 shadow-xs transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export Quiz</span>
          </button>

          <button
            type="button"
            onClick={onExitQuiz}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Chat</span>
          </button>
        </div>

        {/* Toggle Detailed Review Accordion */}
        <div className="mt-8 pt-6 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setShowReview(!showReview)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <span>{showReview ? "Hide Detailed Answer Review" : "Review All Questions & Explanations"}</span>
            {showReview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Detailed Review Section */}
      {showReview && (
        <div className="mt-6 space-y-4 animate-in fade-in duration-150">
          {questions.map((q, idx) => {
            const userChoice = userAnswers[idx];
            const isCorrect = userChoice === q.correctAnswer;

            return (
              <div
                key={q.id || idx}
                className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-stone-100 text-xs font-bold text-stone-700">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-semibold text-stone-900 leading-snug">
                        {q.question}
                      </h4>
                      {q.topic && (
                        <span className="inline-block mt-1 text-[11px] text-stone-400 font-medium">
                          Topic: {q.topic}
                        </span>
                      )}
                    </div>
                  </div>

                  {isCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200 flex-shrink-0">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Correct
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 border border-red-200 flex-shrink-0">
                      <XCircle className="h-3.5 w-3.5" />
                      Incorrect
                    </span>
                  )}
                </div>

                {/* Options List */}
                <div className="mt-4 space-y-2">
                  {q.options.map((opt, optIdx) => {
                    const isOptionCorrect = optIdx === q.correctAnswer;
                    const wasSelected = optIdx === userChoice;

                    let rowStyle = "border-stone-200 bg-white text-stone-700";
                    if (isOptionCorrect) {
                      rowStyle = "border-emerald-300 bg-emerald-50/60 text-emerald-900 font-medium";
                    } else if (wasSelected && !isCorrect) {
                      rowStyle = "border-red-300 bg-red-50/60 text-red-900 line-through opacity-80";
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center justify-between rounded-xl border p-2.5 text-xs ${rowStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                        {isOptionCorrect && (
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Correct Answer
                          </span>
                        )}
                        {wasSelected && !isCorrect && (
                          <span className="text-[11px] font-semibold text-red-700">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Grounded Explanation & Verifiable Citation */}
                <div className="mt-3.5 pt-3 border-t border-stone-100 rounded-lg bg-stone-50/80 p-3">
                  <p className="text-xs text-stone-700 leading-relaxed">
                    <span className="font-semibold text-stone-900">Explanation: </span>
                    {q.explanation}
                  </p>
                  {q.sourcePages && q.sourcePages.length > 0 && (
                    <div className="mt-2">
                      <Citation sources={q.sourcePages} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
