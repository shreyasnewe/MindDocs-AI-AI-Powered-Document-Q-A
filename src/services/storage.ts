import { ConversationSession, DocumentMetadata, DocumentAnalysis, ChatMessageItem } from "../types";

const SESSIONS_KEY = "minddocs_sessions_v1";
const ACTIVE_SESSION_ID_KEY = "minddocs_active_session_id_v1";
const LEGACY_SESSIONS_KEY = "documind_sessions_v1";
const LEGACY_ACTIVE_SESSION_ID_KEY = "documind_active_session_id_v1";

export function getSavedSessions(): ConversationSession[] {
  try {
    let raw = localStorage.getItem(SESSIONS_KEY);
    if (!raw) {
      // Migrate from legacy storage if available
      raw = localStorage.getItem(LEGACY_SESSIONS_KEY);
      if (raw) {
        localStorage.setItem(SESSIONS_KEY, raw);
      }
    }
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read saved sessions:", err);
    return [];
  }
}

export function saveSessions(sessions: ConversationSession[]): void {
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error("Failed to save sessions to localStorage:", err);
  }
}

export function saveOrUpdateSession(session: ConversationSession): void {
  const sessions = getSavedSessions();
  const index = sessions.findIndex((s) => s.id === session.id);
  if (index >= 0) {
    sessions[index] = { ...session, updatedAt: new Date().toISOString() };
  } else {
    sessions.unshift({ ...session, updatedAt: new Date().toISOString() });
  }
  // Cap at last 25 sessions
  saveSessions(sessions.slice(0, 25));
  setActiveSessionId(session.id);
}

export function deleteSessionFromStorage(sessionId: string): ConversationSession[] {
  const sessions = getSavedSessions().filter((s) => s.id !== sessionId);
  saveSessions(sessions);
  if (getActiveSessionId() === sessionId) {
    clearActiveSessionId();
  }
  return sessions;
}

export function getActiveSessionId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_SESSION_ID_KEY);
  } catch {
    return null;
  }
}

export function setActiveSessionId(id: string): void {
  try {
    localStorage.setItem(ACTIVE_SESSION_ID_KEY, id);
  } catch {
    // ignore
  }
}

export function clearActiveSessionId(): void {
  try {
    localStorage.removeItem(ACTIVE_SESSION_ID_KEY);
  } catch {
    // ignore
  }
}

export function createNewSession(
  document: DocumentMetadata,
  analysis: DocumentAnalysis
): ConversationSession {
  const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const now = new Date().toISOString();
  const session: ConversationSession = {
    id,
    document,
    analysis,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  saveOrUpdateSession(session);
  return session;
}
