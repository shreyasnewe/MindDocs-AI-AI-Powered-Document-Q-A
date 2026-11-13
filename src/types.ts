export interface DocumentMetadata {
  name: string;
  mimeType: string;
  size: string;
  sizeBytes?: number;
  fileUri: string;
}

export interface DocumentAnalysis {
  summary: string;
  keyTopics: string[];
  importantConcepts: string[];
  suggestedQuestions: string[];
}

export interface ChatMessageItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  sources?: number[];
  actionLoadingType?: 'simpler' | 'example' | 'deeper' | null;
}

export interface ConversationSession {
  id: string;
  document: DocumentMetadata;
  analysis: DocumentAnalysis;
  messages: ChatMessageItem[];
  createdAt: string;
  updatedAt: string;
}

export type ActionType = 'notes' | 'mcqs' | 'simplify' | 'important-questions';

export type FollowUpActionType = 'simpler' | 'example' | 'deeper' | 'followup';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  sourcePages?: number[];
  topic: string;
}

export interface QuizSetupConfig {
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
}

export type ExportFormat = 'pdf' | 'markdown' | 'txt';
export type ExportTarget = 'conversation' | 'notes' | 'quiz';

