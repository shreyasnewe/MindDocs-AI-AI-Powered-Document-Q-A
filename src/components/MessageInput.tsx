import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isLoading,
  disabled = false,
}) => {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea based on input
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        140
      )}px`;
    }
  }, [text]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || isLoading || disabled) return;

    onSendMessage(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isButtonDisabled = !text.trim() || isLoading || disabled;

  return (
    <div className="sticky bottom-0 z-20 w-full bg-gradient-to-t from-stone-50 via-stone-50/95 to-transparent pb-4 pt-3 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-end gap-2 rounded-2xl border border-stone-300/80 bg-white p-2 shadow-sm focus-within:border-stone-400 focus-within:ring-2 focus-within:ring-stone-200 transition-all"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading || disabled}
            placeholder="Ask anything about this document..."
            className="w-full resize-none bg-transparent px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden disabled:opacity-60 max-h-[140px]"
          />

          <button
            type="submit"
            disabled={isButtonDisabled}
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-150 ${
              isButtonDisabled
                ? "bg-stone-100 text-stone-400 cursor-not-allowed"
                : "bg-stone-900 text-white shadow-xs hover:bg-stone-800 active:scale-95"
            }`}
            title={isLoading ? "MindDocs is thinking..." : "Send message"}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-stone-600" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </button>
        </form>

        <div className="flex items-center justify-between px-2 pt-1.5 text-[11px] text-stone-400">
          <span>
            <kbd className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px] text-stone-500">
              Enter
            </kbd>{" "}
            to send,{" "}
            <kbd className="font-mono bg-stone-100 px-1 py-0.5 rounded text-[10px] text-stone-500">
              Shift + Enter
            </kbd>{" "}
            for new line
          </span>
          <span className="hidden sm:inline">Grounded strictly in uploaded document</span>
        </div>
      </div>
    </div>
  );
};
