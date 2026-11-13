import { Request, Response } from "express";
import { askDocumentQuestion, handleFollowUpAction, isAuthError } from "../services/geminiService";

export async function sendMessage(req: Request, res: Response) {
  const { fileUri, message, history, mimeType } = req.body;

  if (!fileUri) {
    res.status(400).json({
      success: false,
      message: "Document reference is required to ask questions.",
    });
    return;
  }

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({
      success: false,
      message: "Please provide a valid question.",
    });
    return;
  }

  try {
    const formattedHistory = Array.isArray(history)
      ? history.map((item: any) => ({
          role: item.role === "model" ? ("model" as const) : ("user" as const),
          text: String(item.text || ""),
        }))
      : [];

    const result = await askDocumentQuestion(fileUri, message.trim(), formattedHistory, mimeType || "application/pdf");

    res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources || [],
    });
  } catch (error: any) {
    console.error("Chat question answering error:", error);

    let clientMessage = "Something went wrong while generating the answer. Please try again.";
    let statusCode = 500;

    if (!process.env.GEMINI_API_KEY) {
      clientMessage = "GEMINI_API_KEY is not configured. Please set it in Settings > Secrets.";
      statusCode = 401;
    } else if (isAuthError(error)) {
      clientMessage = "Gemini API key is unauthenticated (401). Please check GEMINI_API_KEY in Settings > Secrets.";
      statusCode = 401;
    } else if (error?.status === 404 || error?.message?.includes("not found") || error?.message?.includes("expired")) {
      clientMessage = "The document reference is not found or has expired. Please re-upload the document.";
      statusCode = 404;
    } else if (error?.status === 429) {
      clientMessage = "Rate limit reached. Please wait a few moments before asking another question.";
      statusCode = 429;
    }

    res.status(statusCode).json({
      success: false,
      message: clientMessage,
    });
  }
}

export async function handleChatAction(req: Request, res: Response) {
  const { fileUri, action, history, mimeType } = req.body;

  if (!fileUri) {
    res.status(400).json({
      success: false,
      message: "Document reference is required.",
    });
    return;
  }

  if (!action || !["simpler", "example", "deeper"].includes(action)) {
    res.status(400).json({
      success: false,
      message: "Invalid action. Supported actions are: simpler, example, deeper.",
    });
    return;
  }

  try {
    const formattedHistory = Array.isArray(history)
      ? history.map((item: any) => ({
          role: item.role === "model" ? ("model" as const) : ("user" as const),
          text: String(item.text || ""),
        }))
      : [];

    const result = await handleFollowUpAction(
      fileUri,
      action as "simpler" | "example" | "deeper",
      formattedHistory,
      mimeType || "application/pdf"
    );

    res.status(200).json({
      success: true,
      answer: result.answer,
      sources: result.sources || [],
    });
  } catch (error: any) {
    console.error("Chat action error:", error);

    let clientMessage = error?.message || "Failed to process follow-up action.";
    let statusCode = 500;

    if (isAuthError(error)) {
      clientMessage = "Gemini API key is unauthenticated (401). Please check GEMINI_API_KEY in Settings > Secrets.";
      statusCode = 401;
    }

    res.status(statusCode).json({
      success: false,
      message: clientMessage,
    });
  }
}

export async function clearConversation(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: "Conversation history cleared successfully.",
  });
}
