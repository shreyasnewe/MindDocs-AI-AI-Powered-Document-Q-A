import React, { useEffect, useRef } from "react";
import { DocumentMetadata, DocumentAnalysis, ChatMessageItem, ActionType, FollowUpActionType } from "../types";
import { DocumentCard } from "./DocumentCard";
import { DocumentOverview } from "./DocumentOverview";
import { ChatMessage } from "./ChatMessage";
import { Sparkles } from "lucide-react";

interface ChatProps {
  document: DocumentMetadata;
  analysis: DocumentAnalysis;
  messages: ChatMessageItem[];
  isLoading: boolean;
  onSelectSuggestedQuestion: (question: string) => void;
  onExecuteAction: (action: ActionType) => void;
  isActionLoading: boolean;
  onMessageAction?: (messageId: string, action: FollowUpActionType) => void;
  onOpenQuiz?: () => void;
  activeActionMessageId?: string | null;
  activeActionType?: FollowUpActionType | null;
}

export const Chat: React.FC<ChatProps> = ({
  document,
  analysis,
  messages,
  isLoading,
  onSelectSuggestedQuestion,
  onExecuteAction,
  isActionLoading,
  onMessageAction,
  onOpenQuiz,
  activeActionMessageId = null,
  activeActionType = null,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll when new messages arrive or loading state changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-4 pb-8 flex-1">
      {/* Compact Document Header Card */}
      <DocumentCard document={document} />

      {/* Structured Document Overview */}
      <DocumentOverview
        analysis={analysis}
        onSelectSuggestedQuestion={onSelectSuggestedQuestion}
        onExecuteAction={onExecuteAction}
        onOpenQuiz={onOpenQuiz}
        isActionLoading={isActionLoading || isLoading}
      />

      {/* Chat Messages Section */}
      <div className="space-y-4 pt-2">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 p-8 text-center bg-white/50 my-6">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-600 mb-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
            <p className="text-sm font-medium text-stone-800">
              Ready for your questions!
            </p>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Ask any specific question or click one of the suggested questions above to start exploring this document.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              onAction={onMessageAction}
              isActionLoading={activeActionMessageId === message.id}
              loadingAction={activeActionMessageId === message.id ? activeActionType : null}
            />
          ))
        )}

        {/* AI Typing / Generating Indicator */}
        {isLoading && (
          <div className="flex w-full my-3 justify-start animate-in fade-in duration-200">
            <div className="flex max-w-[80%] gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                <Sparkles className="h-4 w-4 animate-pulse" />
              </div>

              <div className="flex items-center gap-2 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-xs text-stone-500 shadow-xs">
                <span>MindDocs is thinking</span>
                <div className="flex space-x-1 items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.3s]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce [animation-delay:-0.15s]" />
                  <div className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-bounce" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} className="h-2" />
      </div>
    </div>
  );
};
