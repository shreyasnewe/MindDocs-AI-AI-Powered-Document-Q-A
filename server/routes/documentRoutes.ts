import { Router } from "express";
import { upload } from "../middleware/uploadMiddleware";
import { uploadDocument, startNewDocument, handleDocumentAction } from "../controllers/documentController";

const router = Router();

// POST /api/documents/upload - Upload PDF & send to Gemini Files API
router.post("/upload", upload.single("document"), uploadDocument);

// POST /api/documents/new - Start new document session
router.post("/new", startNewDocument);

// POST /api/documents/action - Run auxiliary action (notes, mcqs, simplify, important-questions)
router.post("/action", handleDocumentAction);

export default router;
