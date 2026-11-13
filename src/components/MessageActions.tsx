import React from "react";
import { Sparkles, Lightbulb, Compass, MessageSquarePlus, Loader2 } from "lucide-react";
import { FollowUpActionType } from "../types";

interface MessageActionsProps {
  onAction: (action: FollowUpActionType) => void;
  isLoading?: boolean;
  loadingAction?: FollowUpActionType | null;
}

export const MessageActions: React.FC<MessageActionsProps> = ({
  onAction,
  isLoading = false,
  loadingAction = null,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-100/80">
      {/* Explain Simpler */}
      <button
        type="button"
        onClick={() => onAction("simpler")}
        disabled={isLoading}
        className="inline-flex items-center gap-1 rounded-md bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 px-2 py-1 text-[11px] font-medium text-stone-600 transition-colors disabled:opacity-50"
        title="Explain this response in simpler language"
      >
        {isLoading && loadingAction === "simpler" ? (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
        ) : (
          <Sparkles className="h-3 w-3 text-amber-500" />
        )}
        <span>Explain Simpler</span>
      </button>

      {/* Give Example */}
      <button
        type="button"
        onClick={() => onAction("example")}
        disabled={isLoading}
        className="inline-flex items-center gap-1 rounded-md bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 px-2 py-1 text-[11px] font-medium text-stone-600 transition-colors disabled:opacity-50"
        title="Provide an illustrative example for this concept"
      >
        {isLoading && loadingAction === "example" ? (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
        ) : (
          <Lightbulb className="h-3 w-3 text-amber-600" />
        )}
        <span>Give Example</span>
      </button>

      {/* Go Deeper */}
      <button
        type="button"
        onClick={() => onAction("deeper")}
        disabled={isLoading}
        className="inline-flex items-center gap-1 rounded-md bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 px-2 py-1 text-[11px] font-medium text-stone-600 transition-colors disabled:opacity-50"
        title="Dive deeper with technical details and nuances"
      >
        {isLoading && loadingAction === "deeper" ? (
          <Loader2 className="h-3 w-3 animate-spin text-indigo-600" />
        ) : (
          <Compass className="h-3 w-3 text-indigo-600" />
        )}
        <span>Go Deeper</span>
      </button>

      {/* Ask Follow-up */}
      <button
        type="button"
        onClick={() => onAction("followup")}
        disabled={isLoading}
        className="inline-flex items-center gap-1 rounded-md bg-stone-50 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80 px-2 py-1 text-[11px] font-medium text-stone-600 transition-colors disabled:opacity-50"
        title="Type a custom follow-up question regarding this answer"
      >
        <MessageSquarePlus className="h-3 w-3 text-emerald-600" />
        <span>Ask Follow-up</span>
      </button>
    </div>
  );
};
