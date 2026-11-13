import React from "react";
import { FileText, CheckCircle2 } from "lucide-react";
import { DocumentMetadata } from "../types";

interface DocumentCardProps {
  document: DocumentMetadata;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({ document }) => {
  return (
    <div className="flex items-center justify-between rounded-xl border border-stone-200/90 bg-stone-100/70 p-3.5 shadow-xs mb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white border border-stone-200 text-stone-700 shadow-xs">
          <FileText className="h-5 w-5 text-indigo-600" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-stone-900 truncate" title={document.name}>
            {document.name}
          </h2>
          <div className="flex items-center gap-2 text-xs text-stone-500">
            <span>PDF</span>
            <span>•</span>
            <span>{document.size}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200/60 flex-shrink-0">
        <CheckCircle2 className="h-3 w-3 text-emerald-600" />
        <span className="hidden sm:inline">Active & Indexed</span>
      </div>
    </div>
  );
};
