import React from "react";
import { FileText, ExternalLink } from "lucide-react";

interface CitationProps {
  sources?: number[];
  className?: string;
}

export const Citation: React.FC<CitationProps> = ({ sources, className = "" }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  // Sort and deduplicate page numbers
  const uniquePages = Array.from(new Set(sources)).sort((a, b) => a - b);
  const label = uniquePages.length === 1 ? `Page ${uniquePages[0]}` : `Pages ${uniquePages.join(", ")}`;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-lg bg-stone-100/90 hover:bg-stone-200/70 border border-stone-200/80 px-2.5 py-1 text-[11px] font-medium text-stone-700 transition-colors cursor-default ${className}`}
      title={`Grounding citation verified from document (${label})`}
    >
      <FileText className="h-3 w-3 text-indigo-600 flex-shrink-0" />
      <span className="font-semibold text-stone-900">Source:</span>
      <span>{label}</span>
    </div>
  );
};
