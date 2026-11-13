import axios from "axios";
import { DocumentMetadata, DocumentAnalysis, QuizQuestion } from "../types";

export interface UploadResponse {
  success: boolean;
  document: DocumentMetadata;
  analysis: DocumentAnalysis;
  authWarning?: string;
  message?: string;
}

export interface ChatResponse {
  success: boolean;
  answer: string;
  sources?: number[];
  message?: string;
}

export interface ActionResponse {
  success: boolean;
  title: string;
  answer: string;
  sources?: number[];
  message?: string;
}

export interface QuizResponse {
  success: boolean;
  questions: QuizQuestion[];
  message?: string;
}

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export async function uploadDocumentApi(
  file: File,
  onUploadProgress?: (percentCompleted: number) => void
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("document", file);

  const response = await apiClient.post<UploadResponse>("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onUploadProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onUploadProgress(percent);
      }
    },
  });

  return response.data;
}

export async function sendChatMessageApi(
  fileUri: string,
  message: string,
  history: Array<{ role: "user" | "model"; text: string }>,
  mimeType: string = "application/pdf"
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>("/chat", {
    fileUri,
    message,
    history,
    mimeType,
  });

  return response.data;
}

export async function sendFollowUpActionApi(
  fileUri: string,
  action: "simpler" | "example" | "deeper",
  history: Array<{ role: "user" | "model"; text: string }>,
  mimeType: string = "application/pdf"
): Promise<ChatResponse> {
  const response = await apiClient.post<ChatResponse>("/chat/action", {
    fileUri,
    action,
    history,
    mimeType,
  });

  return response.data;
}

export async function executeDocumentActionApi(
  fileUri: string,
  action: "notes" | "mcqs" | "simplify" | "important-questions",
  mimeType: string = "application/pdf"
): Promise<ActionResponse> {
  const response = await apiClient.post<ActionResponse>("/documents/action", {
    fileUri,
    action,
    mimeType,
  });

  return response.data;
}

export async function generateQuizApi(
  fileUri: string,
  numberOfQuestions: number = 5,
  difficulty: "easy" | "medium" | "hard" = "medium",
  topic: string = "Entire Document",
  mimeType: string = "application/pdf"
): Promise<QuizResponse> {
  const response = await apiClient.post<QuizResponse>("/quiz/generate", {
    fileUri,
    numberOfQuestions,
    difficulty,
    topic,
    mimeType,
  });

  return response.data;
}

export async function startNewDocumentApi(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.post("/documents/new");
  return response.data;
}

export async function clearConversationApi(): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete("/chat");
  return response.data;
}

export async function checkHealthApi(): Promise<{ status: string }> {
  const response = await apiClient.get("/health");
  return response.data;
}

