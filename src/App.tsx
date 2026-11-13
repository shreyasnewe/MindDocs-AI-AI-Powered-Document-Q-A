import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { UploadArea } from "./components/UploadArea";
import { Chat } from "./components/Chat";
import { MessageInput } from "./components/MessageInput";
import { ChatHistory } from "./components/ChatHistory";
import { ClearConversationModal } from "./components/ClearConversationModal";
import { NewDocumentModal } from "./components/NewDocumentModal";
import { QuizSetup } from "./components/QuizSetup";
import { QuizMode } from "./components/QuizMode";
import { ExportModal } from "./components/ExportModal";
import {
  uploadDocumentApi,
  sendChatMessageApi,
  sendFollowUpActionApi,
  executeDocumentActionApi,
  generateQuizApi,
  clearConversationApi,
  startNewDocumentApi,
} from "./services/api";
import {
  getSavedSessions,
  saveOrUpdateSession,
  deleteSessionFromStorage,
  createNewSession,
  getActiveSessionId,
  clearActiveSessionId,
} from "./services/storage";
import {
  ConversationSession,
  ChatMessageItem,
  ActionType,
  FollowUpActionType,
  QuizQuestion,
  QuizSetupConfig,
} from "./types";
import { AlertCircle, AlertTriangle, X } from "lucide-react";

export default function App() {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [activeSession, setActiveSession] = useState<ConversationSession | null>(null);

  // Loading and progress states
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Contextual Follow-up action states
  const [activeActionMessageId, setActiveActionMessageId] = useState<string | null>(null);
  const [activeActionType, setActiveActionType] = useState<FollowUpActionType | null>(null);

  // Modal open states
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isNewDocModalOpen, setIsNewDocModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Quiz Mode states
  const [isQuizSetupOpen, setIsQuizSetupOpen] = useState(false);
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[] | null>(null);

  // Initial load from localStorage
  useEffect(() => {
    const loadedSessions = getSavedSessions();
    setSessions(loadedSessions);

    const activeId = getActiveSessionId();
    if (activeId) {
      const existing = loadedSessions.find((s) => s.id === activeId);
      if (existing) {
        setActiveSession(existing);
      }
    }
  }, []);

  // Sync activeSession changes back to sessions and storage
  const updateActiveSession = useCallback(
    (updater: (prev: ConversationSession) => ConversationSession) => {
      setActiveSession((prev) => {
        if (!prev) return null;
        const updated = updater(prev);
        saveOrUpdateSession(updated);
        setSessions(getSavedSessions());
        return updated;
      });
    },
    []
  );

  // Upload Document handler
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const response = await uploadDocumentApi(file, (percent) => {
        setUploadProgress(percent);
      });

      if (!response || !response.success || !response.document) {
        throw new Error(response?.message || "Could not process the uploaded document. Please ensure it is a valid PDF.");
      }

      // Create new conversation session
      const newSession = createNewSession(response.document, response.analysis);
      setActiveSession(newSession);
      setSessions(getSavedSessions());

      if (response.authWarning) {
        setWarningMessage(response.authWarning);
      }
    } catch (err: any) {
      console.error("Upload error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not analyze document. Please check your Gemini API key and try again.";
      setErrorMessage(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Chat message send handler with source citations
  const handleSendMessage = async (text: string) => {
    if (!activeSession || !text.trim() || isAiThinking) return;

    const userMessage: ChatMessageItem = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    // Optimistically append user message
    updateActiveSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    setIsAiThinking(true);
    setErrorMessage(null);

    try {
      // Build history for Gemini
      const historyPayload = activeSession.messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await sendChatMessageApi(
        activeSession.document.fileUri,
        text,
        historyPayload,
        activeSession.document.mimeType
      );

      if (!res.success) {
        throw new Error(res.message || "Failed to get an answer from Gemini.");
      }

      const modelMessage: ChatMessageItem = {
        id: `msg_model_${Date.now()}`,
        role: "model",
        text: res.answer,
        timestamp: new Date().toISOString(),
        sources: res.sources,
      };

      updateActiveSession((prev) => ({
        ...prev,
        messages: [...prev.messages, modelMessage],
      }));
    } catch (err: any) {
      console.error("Chat error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate answer. Please try asking again.";
      setErrorMessage(msg);
    } finally {
      setIsAiThinking(false);
    }
  };

  // Follow-up message actions handler (Explain Simpler, Give Example, Go Deeper, Ask Follow-up)
  const handleMessageAction = async (messageId: string, action: FollowUpActionType) => {
    if (!activeSession || isAiThinking || isActionLoading) return;

    if (action === "followup") {
      const inputEl = document.querySelector<HTMLInputElement>("input[type='text'], textarea");
      if (inputEl) {
        inputEl.focus();
        inputEl.scrollIntoView({ behavior: "smooth" });
      }
      return;
    }

    setActiveActionMessageId(messageId);
    setActiveActionType(action);
    setErrorMessage(null);

    const actionTextMap: Record<"simpler" | "example" | "deeper", string> = {
      simpler: "Could you explain this simpler?",
      example: "Can you provide a clear real-world example of this?",
      deeper: "Could you go deeper and explain the technical details and nuances?",
    };

    const userPrompt = actionTextMap[action];

    const userMessage: ChatMessageItem = {
      id: `msg_action_user_${Date.now()}`,
      role: "user",
      text: userPrompt,
      timestamp: new Date().toISOString(),
    };

    updateActiveSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    try {
      const historyPayload = activeSession.messages.map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await sendFollowUpActionApi(
        activeSession.document.fileUri,
        action,
        historyPayload,
        activeSession.document.mimeType
      );

      if (!res.success) {
        throw new Error(res.message || "Failed to process follow-up action.");
      }

      const modelMessage: ChatMessageItem = {
        id: `msg_action_model_${Date.now()}`,
        role: "model",
        text: res.answer,
        timestamp: new Date().toISOString(),
        sources: res.sources,
      };

      updateActiveSession((prev) => ({
        ...prev,
        messages: [...prev.messages, modelMessage],
      }));
    } catch (err: any) {
      console.error("Follow-up action error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not execute follow-up action. Please try again.";
      setErrorMessage(msg);
    } finally {
      setActiveActionMessageId(null);
      setActiveActionType(null);
    }
  };

  // Suggested questions handler
  const handleSelectSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  // Auxiliary actions handler (Notes, MCQs, Simplify, Important Questions)
  const handleExecuteAction = async (action: ActionType) => {
    if (!activeSession || isAiThinking || isActionLoading) return;

    if (action === "mcqs") {
      setIsQuizSetupOpen(true);
      return;
    }

    setIsActionLoading(true);
    setErrorMessage(null);

    const actionLabels: Record<ActionType, string> = {
      notes: "Generate comprehensive structured notes",
      mcqs: "Generate multiple-choice practice questions",
      simplify: "Explain difficult concepts in beginner-friendly terms",
      "important-questions": "Generate important questions & answers",
    };

    const userMessage: ChatMessageItem = {
      id: `msg_action_user_${Date.now()}`,
      role: "user",
      text: actionLabels[action] || "Execute document analysis action",
      timestamp: new Date().toISOString(),
    };

    updateActiveSession((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    try {
      const res = await executeDocumentActionApi(
        activeSession.document.fileUri,
        action,
        activeSession.document.mimeType
      );

      if (!res.success) {
        throw new Error(res.message || "Failed to execute document action.");
      }

      const modelMessage: ChatMessageItem = {
        id: `msg_action_model_${Date.now()}`,
        role: "model",
        text: `### ${res.title}\n\n${res.answer}`,
        timestamp: new Date().toISOString(),
        sources: res.sources,
      };

      updateActiveSession((prev) => ({
        ...prev,
        messages: [...prev.messages, modelMessage],
      }));
    } catch (err: any) {
      console.error("Action execution error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not complete action. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsActionLoading(false);
    }
  };

  // Start Quiz generator handler
  const handleStartQuiz = async (config: QuizSetupConfig) => {
    if (!activeSession) return;

    setIsGeneratingQuiz(true);
    setErrorMessage(null);

    try {
      const res = await generateQuizApi(
        activeSession.document.fileUri,
        config.numberOfQuestions,
        config.difficulty,
        config.topic,
        activeSession.document.mimeType
      );

      if (!res.success || !res.questions || res.questions.length === 0) {
        throw new Error(res.message || "Failed to generate quiz questions.");
      }

      setQuizQuestions(res.questions);
      setIsQuizSetupOpen(false);
      setIsQuizActive(true);
    } catch (err: any) {
      console.error("Quiz generation error:", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate interactive quiz. Please try again.";
      setErrorMessage(msg);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Clear current conversation handler
  const handleConfirmClearConversation = async () => {
    if (!activeSession) return;

    try {
      await clearConversationApi();
      updateActiveSession((prev) => ({
        ...prev,
        messages: [],
      }));
    } catch (err) {
      console.error("Clear conversation error:", err);
      // Still clear local state
      updateActiveSession((prev) => ({
        ...prev,
        messages: [],
      }));
    }
  };

  // Start new document handler
  const handleConfirmNewDocument = async () => {
    try {
      await startNewDocumentApi();
    } catch (err) {
      console.warn("New document endpoint error (ignored):", err);
    }
    setActiveSession(null);
    setQuizQuestions(null);
    setIsQuizActive(false);
    clearActiveSessionId();
  };

  // Select session from history
  const handleSelectSession = (session: ConversationSession) => {
    setActiveSession(session);
    setQuizQuestions(null);
    setIsQuizActive(false);
    saveOrUpdateSession(session);
  };

  // Delete session from history
  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = deleteSessionFromStorage(sessionId);
    setSessions(updated);
    if (activeSession?.id === sessionId) {
      setActiveSession(null);
      setQuizQuestions(null);
      setIsQuizActive(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 font-sans text-stone-900 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Header Bar */}
      <Header
        currentDocument={activeSession ? activeSession.document : null}
        messageCount={activeSession ? activeSession.messages.length : 0}
        historyCount={sessions.length}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenClearModal={() => setIsClearModalOpen(true)}
        onOpenNewDocModal={() => setIsNewDocModalOpen(true)}
        onOpenQuiz={() => setIsQuizSetupOpen(true)}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Global Error Banner if any */}
      {errorMessage && (
        <div className="sticky top-16 z-20 w-full bg-red-600 text-white px-4 py-2.5 shadow-md flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="flex-1 font-medium">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="p-1 hover:bg-red-700 rounded-lg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Global Warning Banner if any (e.g. Offline fallback / Gemini API key prompt) */}
      {warningMessage && (
        <div className="sticky top-16 z-20 w-full bg-amber-500 text-stone-900 px-4 py-2.5 shadow-xs border-b border-amber-600/30 flex items-center justify-between text-xs sm:text-sm animate-in fade-in">
          <div className="flex items-center gap-2 max-w-4xl mx-auto w-full">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 text-amber-950" />
            <p className="flex-1 font-medium">{warningMessage}</p>
            <button
              type="button"
              onClick={() => setWarningMessage(null)}
              className="p-1 hover:bg-amber-600/20 rounded-lg transition-colors text-stone-900"
              title="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Upload Area OR Document Chat OR Quiz Mode */}
      <main className="flex flex-1 flex-col">
        {!activeSession ? (
          <UploadArea
            onFileUpload={handleFileUpload}
            isLoading={isUploading}
            uploadProgress={uploadProgress}
          />
        ) : isQuizActive && quizQuestions ? (
          <QuizMode
            document={activeSession.document}
            questions={quizQuestions}
            onExit={() => setIsQuizActive(false)}
            onOpenExport={() => setIsExportModalOpen(true)}
            onRetake={() => {}}
          />
        ) : (
          <div className="flex flex-1 flex-col justify-between">
            <Chat
              document={activeSession.document}
              analysis={activeSession.analysis}
              messages={activeSession.messages}
              isLoading={isAiThinking}
              onSelectSuggestedQuestion={handleSelectSuggestedQuestion}
              onExecuteAction={handleExecuteAction}
              isActionLoading={isActionLoading}
              onMessageAction={handleMessageAction}
              onOpenQuiz={() => setIsQuizSetupOpen(true)}
              activeActionMessageId={activeActionMessageId}
              activeActionType={activeActionType}
            />

            <MessageInput
              onSendMessage={handleSendMessage}
              isLoading={isAiThinking || isActionLoading || !!activeActionMessageId}
            />
          </div>
        )}
      </main>

      {/* Interactive Quiz Setup Modal */}
      <QuizSetup
        isOpen={isQuizSetupOpen}
        onClose={() => setIsQuizSetupOpen(false)}
        document={activeSession?.document || null}
        analysis={activeSession?.analysis || null}
        onStartQuiz={handleStartQuiz}
        isLoading={isGeneratingQuiz}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        document={activeSession?.document || null}
        analysis={activeSession?.analysis || null}
        messages={activeSession?.messages || []}
        quizQuestions={quizQuestions}
      />

      {/* Chat History Modal */}
      <ChatHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        activeSessionId={activeSession?.id || null}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />

      {/* Clear Conversation Confirmation Modal */}
      <ClearConversationModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearConversation}
        documentName={activeSession?.document.name}
      />

      {/* New Document Confirmation Modal */}
      <NewDocumentModal
        isOpen={isNewDocModalOpen}
        onClose={() => setIsNewDocModalOpen(false)}
        onConfirm={handleConfirmNewDocument}
        currentDocumentName={activeSession?.document.name}
      />
    </div>
  );
}
