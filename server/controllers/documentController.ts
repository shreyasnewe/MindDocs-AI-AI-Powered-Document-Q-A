import { Request, Response } from "express";
import fs from "fs";
import {
  uploadPdfToGemini,
  analyzeDocumentWithGemini,
  runDocumentAction,
  isAuthError,
} from "../services/geminiService";
import {
  saveStoredDocument,
  parsePdfContent,
  createLocalSummaryAndInsights,
  StoredDocument,
} from "../services/documentStore";

function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function uploadDocument(req: Request, res: Response) {
  const file = req.file;

  if (!file) {
    res.status(400).json({
      success: false,
      message: "No document file was uploaded. Please select a valid PDF.",
    });
    return;
  }

  const tempPath = file.path;

  try {
    const formattedSize = formatBytes(file.size);
    const fileBuffer = fs.readFileSync(tempPath);

    // 1. Parse PDF text locally
    const parsedPdf = await parsePdfContent(fileBuffer);

    // 2. Attempt uploading to Gemini Files API (optional/enhancement)
    const geminiFile = await uploadPdfToGemini(tempPath, file.originalname, file.mimetype || "application/pdf");

    // 3. Store document in local memory buffer so requests can always access it
    const docId = `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const storedDoc: StoredDocument = {
      id: docId,
      name: file.originalname,
      mimeType: file.mimetype || "application/pdf",
      size: formattedSize,
      sizeBytes: file.size,
      buffer: fileBuffer,
      text: parsedPdf.text,
      numPages: parsedPdf.numPages,
      geminiFileUri: geminiFile?.uri,
      createdAt: Date.now(),
    };
    saveStoredDocument(storedDoc);

    // 4. Perform document analysis
    const docRef = geminiFile?.uri || docId;
    let analysisResult: { analysis: any; authWarning?: string };

    try {
      analysisResult = await analyzeDocumentWithGemini(docRef, file.mimetype || "application/pdf");
    } catch (analysisErr: any) {
      console.warn("Analysis fallback on error:", analysisErr);
      const local = createLocalSummaryAndInsights(storedDoc.text || "", storedDoc.name);
      analysisResult = {
        analysis: local,
        authWarning:
          "Gemini API key is unauthenticated (401). Displaying extracted document content. Please verify your GEMINI_API_KEY in Settings > Secrets to unlock full conversational AI.",
      };
    }

    res.status(200).json({
      success: true,
      document: {
        name: file.originalname,
        mimeType: file.mimetype || "application/pdf",
        size: formattedSize,
        sizeBytes: file.size,
        fileUri: docRef,
      },
      analysis: analysisResult.analysis,
      authWarning: analysisResult.authWarning,
    });
  } catch (error: any) {
    console.error("Document upload and analysis error:", error);

    let clientMessage = "Something went wrong while analyzing your document. Please try again.";
    let statusCode = 500;

    const errStr = JSON.stringify(error?.message || error || "");
    const status = error?.status || error?.code || error?.error?.code;

    if (!process.env.GEMINI_API_KEY) {
      clientMessage = "GEMINI_API_KEY is not configured. Please set it in Settings > Secrets.";
      statusCode = 401;
    } else if (isAuthError(error)) {
      clientMessage =
        "Gemini API authentication failed (401 Unauthenticated). Please check that your GEMINI_API_KEY in Settings > Secrets is valid, active, and has the Generative Language API enabled.";
      statusCode = 401;
    } else if (status === 403 || errStr.includes("API_KEY_INVALID") || errStr.includes("PERMISSION_DENIED")) {
      clientMessage = "Gemini API access denied (403). Please verify your API key permissions in Google AI Studio.";
      statusCode = 403;
    } else if (status === 429 || errStr.includes("RESOURCE_EXHAUSTED")) {
      clientMessage = "Gemini rate limit exceeded. Please wait a moment and try again.";
      statusCode = 429;
    } else if (error?.message) {
      clientMessage = error.message;
    }

    res.status(statusCode).json({
      success: false,
      message: clientMessage,
    });
  } finally {
    // Clean up local temp file from multer
    if (tempPath && fs.existsSync(tempPath)) {
      try {
        fs.unlinkSync(tempPath);
      } catch (cleanupErr) {
        console.warn("Could not delete temporary uploaded file:", cleanupErr);
      }
    }
  }
}

export async function startNewDocument(_req: Request, res: Response) {
  res.status(200).json({
    success: true,
    message: "Current document session ended. Ready for a new document.",
  });
}

export async function handleDocumentAction(req: Request, res: Response) {
  const { fileUri, action, mimeType } = req.body;

  if (!fileUri) {
    res.status(400).json({
      success: false,
      message: "Missing document file reference.",
    });
    return;
  }

  if (!action || !["notes", "mcqs", "simplify", "important-questions"].includes(action)) {
    res.status(400).json({
      success: false,
      message: "Invalid action requested. Supported actions: notes, mcqs, simplify, important-questions.",
    });
    return;
  }

  try {
    const result = await runDocumentAction(
      fileUri,
      action as "notes" | "mcqs" | "simplify" | "important-questions",
      mimeType || "application/pdf"
    );

    res.status(200).json({
      success: true,
      title: result.title,
      answer: result.answer,
      sources: result.sources || [],
    });
  } catch (error: any) {
    console.error("Document action error:", error);

    let clientMessage = error?.message || "Failed to process document action.";
    let statusCode = 500;

    if (isAuthError(error)) {
      clientMessage = "Gemini API key is unauthenticated (401). Please update GEMINI_API_KEY in Settings > Secrets.";
      statusCode = 401;
    }

    res.status(statusCode).json({
      success: false,
      message: clientMessage,
    });
  }
}
