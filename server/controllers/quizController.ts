import { Request, Response } from "express";
import { generateQuizQuestions, isAuthError } from "../services/geminiService";

export async function generateQuiz(req: Request, res: Response) {
  const { fileUri, numberOfQuestions, difficulty, topic, mimeType } = req.body;

  if (!fileUri) {
    res.status(400).json({
      success: false,
      message: "Document reference is required to generate a quiz.",
    });
    return;
  }

  const count = Number(numberOfQuestions) || 5;
  const validDifficulty = ["easy", "medium", "hard"].includes(difficulty)
    ? difficulty
    : "medium";
  const validTopic = typeof topic === "string" && topic.trim().length > 0
    ? topic.trim()
    : "Entire Document";

  try {
    const questions = await generateQuizQuestions(
      fileUri,
      count,
      validDifficulty as "easy" | "medium" | "hard",
      validTopic,
      mimeType || "application/pdf"
    );

    res.status(200).json({
      success: true,
      questions,
    });
  } catch (error: any) {
    console.error("Quiz generation error:", error);

    let clientMessage = error?.message || "Failed to generate quiz questions. Please try again.";
    let statusCode = 500;

    if (!process.env.GEMINI_API_KEY) {
      clientMessage = "GEMINI_API_KEY is not configured. Please set it in Settings > Secrets.";
      statusCode = 401;
    } else if (isAuthError(error)) {
      clientMessage = "Gemini API key is unauthenticated (401). Please check GEMINI_API_KEY in Settings > Secrets.";
      statusCode = 401;
    }

    res.status(statusCode).json({
      success: false,
      message: clientMessage,
    });
  }
}
