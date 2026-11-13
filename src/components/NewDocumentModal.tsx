import React from "react";
import { FilePlus } from "lucide-react";

interface NewDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentDocumentName?: string;
}

export const NewDocumentModal: React.FC<NewDocumentModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentDocumentName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <FilePlus className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Start a new document?
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              This will close the current document conversation.
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-stone-50 p-3 text-xs text-stone-600 mb-5 border border-stone-100">
          <p>
            Your current conversation with{" "}
            <span className="font-semibold text-stone-800">
              {currentDocumentName || "this document"}
            </span>{" "}
            will be saved in your Chat History so you can return to it later.
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
            className="rounded-xl bg-stone-900 px-4 py-2 text-xs font-semibold text-white hover:bg-stone-800 shadow-xs transition-colors"
          >
            New Document
          </button>
        </div>
      </div>
    </div>
  );
};
