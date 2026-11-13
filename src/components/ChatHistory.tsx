import React from "react";
import { X, FileText, Trash2, ArrowUpRight, MessageSquare, Clock } from "lucide-react";
import { ConversationSession } from "../types";

interface ChatHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ConversationSession[];
  activeSessionId: string | null;
  onSelectSession: (session: ConversationSession) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
}

function formatRelativeDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  } catch {
    return "Recent";
  }
}

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md rounded-2xl border border-stone-200 bg-white shadow-xl overflow-hidden transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Popup Header */}
        <div className="flex items-center justify-between border-b border-stone-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-stone-900">Chat History</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* History List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-1 divide-y divide-stone-100">
          {sessions.length === 0 ? (
            <div className="py-10 text-center text-stone-400">
              <MessageSquare className="mx-auto h-8 w-8 text-stone-300 mb-2" />
              <p className="text-xs font-medium text-stone-600">No previous chat sessions</p>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Upload a document and start chatting to save conversations.
              </p>
            </div>
          ) : (
            sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const dateLabel = formatRelativeDate(session.updatedAt || session.createdAt);
              const messageCount = session.messages.length;

              return (
                <div
                  key={session.id}
                  onClick={() => {
                    onSelectSession(session);
                    onClose();
                  }}
                  className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                    isActive
                      ? "bg-indigo-50/70 border border-indigo-200/70"
                      : "hover:bg-stone-50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div
                      className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-stone-100 text-stone-600 group-hover:bg-white group-hover:shadow-xs"
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <p
                        className={`text-xs font-semibold truncate ${
                          isActive ? "text-indigo-900" : "text-stone-900"
                        }`}
                        title={session.document.name}
                      >
                        {session.document.name}
                      </p>
                      <p className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                        <span>{dateLabel}</span>
                        <span>•</span>
                        <span>
                          {messageCount} {messageCount === 1 ? "message" : "messages"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => onDeleteSession(session.id, e)}
                      className="rounded-lg p-1.5 text-stone-400 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 transition-all"
                      title="Delete from history"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                    <ArrowUpRight className="h-4 w-4 text-stone-300 group-hover:text-stone-600 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-5 py-3 text-right border-t border-stone-100">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
