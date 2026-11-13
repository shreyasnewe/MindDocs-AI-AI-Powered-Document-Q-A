import React, { useState } from "react";
import Markdown from "react-markdown";
import { Sparkles, User, Copy, Check } from "lucide-react";
import { ChatMessageItem, FollowUpActionType } from "../types";
import { Citation } from "./Citation";
import { MessageActions } from "./MessageActions";

interface ChatMessageProps {
  message: ChatMessageItem;
  onAction?: (messageId: string, action: FollowUpActionType) => void;
  isActionLoading?: boolean;
  loadingAction?: FollowUpActionType | null;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onAction,
  isActionLoading = false,
  loadingAction = null,
}) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={`flex w-full my-3 ${
        isUser ? "justify-end" : "justify-start"
      } animate-in fade-in duration-200`}
    >
      <div
        className={`flex max-w-[90%] sm:max-w-[80%] gap-3 ${
          isUser ? "flex-row-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
            isUser
              ? "bg-stone-800 text-stone-100"
              : "bg-indigo-600 text-white shadow-xs"
          }`}
        >
          {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
        </div>

        {/* Message Content Bubble */}
        <div className="flex flex-col min-w-0">
          <div
            className={`relative rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white border border-stone-200/90 text-stone-800 shadow-xs"
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.text}</p>
            ) : (
              <div className="prose prose-stone prose-sm max-w-none text-stone-800 break-words">
                <Markdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-base font-bold text-stone-900 mt-2 mb-1.5 border-b border-stone-100 pb-1">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-sm font-bold text-stone-900 mt-2 mb-1">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 mt-2 mb-1">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-3 border-indigo-500 pl-3 italic text-stone-600 my-2">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, className }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-[12px] text-stone-800 border border-stone-200/60">
                          {children}
                        </code>
                      ) : (
                        <code className="block rounded-lg bg-stone-900 p-3 font-mono text-[12px] text-stone-100 overflow-x-auto my-2">
                          {children}
                        </code>
                      );
                    },
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-2 border border-stone-200 rounded-lg">
                        <table className="min-w-full text-xs divide-y divide-stone-200">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="bg-stone-50 px-3 py-2 text-left font-semibold text-stone-700">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3 py-2 border-t border-stone-100 text-stone-600">
                        {children}
                      </td>
                    ),
                  }}
                >
                  {message.text}
                </Markdown>

                {/* Grounding Page Citation (if verified from document) */}
                {!isUser && message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center">
                    <Citation sources={message.sources} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Contextual Follow-up Actions (for AI model responses) */}
          {!isUser && onAction && (
            <MessageActions
              onAction={(act) => onAction(message.id, act)}
              isLoading={isActionLoading}
              loadingAction={loadingAction}
            />
          )}

          {/* Timestamp and Copy Action */}
          <div
            className={`flex items-center gap-2 mt-1 px-1 text-[11px] text-stone-400 ${
              isUser ? "justify-end" : "justify-start"
            }`}
          >
            <span>{formattedTime}</span>
            {!isUser && (
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 hover:text-stone-700 transition-colors p-0.5"
                title="Copy response"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span className="text-[10px] text-emerald-600">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span className="text-[10px]">Copy</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
