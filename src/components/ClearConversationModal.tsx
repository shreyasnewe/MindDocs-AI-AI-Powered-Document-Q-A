import React from "react";
import { AlertTriangle } from "lucide-react";

interface ClearConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  documentName?: string;
}

export const ClearConversationModal: React.FC<ClearConversationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  documentName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Clear this conversation?
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              All messages in this conversation will be removed.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 mb-5 border border-stone-100">
          <p>
            Your document{documentName ? ` (${documentName})` : ""} will remain
            active and ready. You can immediately continue asking questions.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors shadow-2xs"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white hover:bg-red-700 shadow-xs transition-colors"
          >
            Clear Conversation
          </button>
        </div>
      </div>
    </div>
  );
};
