import React, { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, X, Sparkles, BookOpen } from "lucide-react";
import { QuizQuestion, DocumentMetadata } from "../types";
import { Citation } from "./Citation";
import { QuizResults } from "./QuizResults";

interface QuizModeProps {
  document: DocumentMetadata;
  questions: QuizQuestion[];
  onExit: () => void;
  onOpenExport: () => void;
  onRetake: () => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  document: doc,
  questions,
  onExit,
  onOpenExport,
  onRetake,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  if (isFinished) {
    return (
      <QuizResults
        document={doc}
        questions={questions}
        userAnswers={userAnswers}
        onRetakeQuiz={() => {
          setCurrentIndex(0);
          setSelectedOption(null);
          setUserAnswers({});
          setIsSubmitted(false);
          setIsFinished(false);
          onRetake();
        }}
        onExitQuiz={onExit}
        onOpenExport={onOpenExport}
      />
    );
  }

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const progressPercent = Math.round(((currentIndex + (isSubmitted ? 1 : 0)) / total) * 100);

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || isSubmitted) return;

    setUserAnswers((prev) => ({
      ...prev,
      [currentIndex]: selectedOption,
    }));
    setIsSubmitted(true);
  };

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsSubmitted(false);
    } else {
      setIsFinished(true);
    }
  };

  const isCurrentCorrect = selectedOption === currentQ.correctAnswer;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-6 sm:py-8 flex flex-col flex-1 animate-in fade-in duration-200">
      {/* Quiz Top Navigation */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-200/80">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold text-xs">
            Q{currentIndex + 1}
          </span>
          <span className="text-xs font-semibold text-stone-700">
            Question {currentIndex + 1} of {total}
          </span>
        </div>

        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 transition-colors p-1"
        >
          <span>Exit Quiz</span>
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-stone-100 h-1.5 rounded-full overflow-hidden mt-2 mb-6">
        <div
          className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Active Question Card */}
      <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs">
        {/* Topic Badge */}
        {currentQ.topic && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-3 py-1 text-[11px] font-semibold text-indigo-700 border border-indigo-100">
              <Sparkles className="h-3 w-3" />
              {currentQ.topic}
            </span>
          </div>
        )}

        {/* Question Text */}
        <h3 className="text-base sm:text-lg font-semibold text-stone-900 leading-snug">
          {currentQ.question}
        </h3>

        {/* 4 Options */}
        <div className="mt-6 space-y-2.5">
          {currentQ.options.map((opt, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = selectedOption === optIdx;
            const isCorrectAnswer = optIdx === currentQ.correctAnswer;

            let optionClasses =
              "border-stone-200/90 bg-stone-50/50 hover:bg-stone-100/80 text-stone-800";

            if (isSelected && !isSubmitted) {
              optionClasses =
                "border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-1 ring-indigo-600 font-medium";
            } else if (isSubmitted) {
              if (isCorrectAnswer) {
                optionClasses =
                  "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500 font-medium";
              } else if (isSelected && !isCorrectAnswer) {
                optionClasses =
                  "border-red-400 bg-red-50 text-red-950 ring-1 ring-red-400 font-medium";
              } else {
                optionClasses = "border-stone-200 bg-stone-50/30 text-stone-400 opacity-60";
              }
            }

            return (
              <button
                key={optIdx}
                type="button"
                onClick={() => handleSelectOption(optIdx)}
                disabled={isSubmitted}
                className={`w-full flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all duration-150 ${optionClasses}`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isSelected && !isSubmitted
                        ? "bg-indigo-600 text-white"
                        : isSubmitted && isCorrectAnswer
                        ? "bg-emerald-600 text-white"
                        : isSubmitted && isSelected && !isCorrectAnswer
                        ? "bg-red-600 text-white"
                        : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {letter}
                  </span>
                  <span className="leading-snug">{opt}</span>
                </div>

                {isSubmitted && isCorrectAnswer && (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0 ml-2" />
                )}
                {isSubmitted && isSelected && !isCorrectAnswer && (
                  <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 ml-2" />
                )}
              </button>
            );
          })}
        </div>

        {/* Immediate Feedback Box (After submission) */}
        {isSubmitted && (
          <div
            className={`mt-6 rounded-2xl p-4 sm:p-5 border animate-in fade-in duration-200 ${
              isCurrentCorrect
                ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                : "bg-amber-50/70 border-amber-200 text-amber-950"
            }`}
          >
            <div className="flex items-center gap-2 mb-1.5 font-bold text-xs uppercase tracking-wider">
              {isCurrentCorrect ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-700">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-amber-600" />
                  <span className="text-amber-700">Incorrect</span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-stone-800 leading-relaxed">
              {currentQ.explanation}
            </p>

            {/* Source Page Citation if available */}
            {currentQ.sourcePages && currentQ.sourcePages.length > 0 && (
              <div className="mt-3">
                <Citation sources={currentQ.sourcePages} />
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions: Submit or Next */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-stone-100">
          {!isSubmitted ? (
            <button
              type="button"
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span>Submit Answer</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
            >
              <span>{currentIndex < total - 1 ? "Next Question" : "View Final Results"}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
