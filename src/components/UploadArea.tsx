import React, { useState, useRef } from "react";
import { UploadCloud, FileText, AlertCircle } from "lucide-react";

interface UploadAreaProps {
  onFileUpload: (file: File) => Promise<void>;
  isLoading: boolean;
  uploadProgress: number;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFileUpload,
  isLoading,
  uploadProgress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndHandleFile = (file: File) => {
    setErrorMessage(null);

    // Validate MIME type & extension
    const isPdf =
      file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      setErrorMessage("Please select a valid PDF file. Only PDFs are supported in V1.");
      return;
    }

    // Validate size (30MB max)
    if (file.size > 30 * 1024 * 1024) {
      setErrorMessage("File size exceeds 30 MB. Please select a smaller PDF.");
      return;
    }

    onFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndHandleFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndHandleFile(e.target.files[0]);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-5rem)] px-4 py-8">
      <div className="w-full max-w-2xl text-center space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900">
          MindDocs AI
        </h1>
        <p className="text-sm sm:text-base text-stone-500 max-w-md mx-auto">
          Upload a PDF and start asking questions about its contents.
        </p>
      </div>

      {/* Main Upload Area Box */}
      <div className="w-full max-w-xl mt-8">
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => {
            if (!isLoading) fileInputRef.current?.click();
          }}
          className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
            isDragOver
              ? "border-indigo-600 bg-indigo-50/50 scale-[1.01]"
              : "border-stone-300 bg-white hover:border-stone-400 hover:bg-stone-50/50"
          } ${isLoading ? "pointer-events-none opacity-85" : "shadow-xs"}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,.pdf"
            onChange={handleFileInputChange}
            className="hidden"
            disabled={isLoading}
          />

          {isLoading ? (
            <div className="flex flex-col items-center justify-center space-y-4 text-center py-4">
              <div className="relative flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-4 border-stone-200 border-t-indigo-600 animate-spin" />
                <FileText className="absolute h-6 w-6 text-stone-500" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-stone-900">
                  Analyzing your document...
                </p>
                <p className="text-xs text-stone-500 max-w-xs">
                  Uploading to Gemini Files API and extracting structured insights.
                </p>
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-48 bg-stone-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 text-stone-700 shadow-inner">
                <UploadCloud className="h-8 w-8 text-stone-600" />
              </div>

              <div className="space-y-1">
                <p className="text-base font-semibold text-stone-800">
                  Drop your PDF here
                </p>
                <p className="text-xs text-stone-400">or click to browse files</p>
              </div>

              <button
                type="button"
                className="mt-2 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-stone-800 transition-colors"
              >
                Upload Document
              </button>

              <div className="pt-2 text-[11px] text-stone-400 flex items-center gap-2">
                <span>PDF format only</span>
                <span>•</span>
                <span>Up to 30 MB</span>
              </div>
            </div>
          )}
        </div>

        {errorMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200/80 animate-in fade-in">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p>{errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
};
