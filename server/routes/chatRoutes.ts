import { Router } from "express";
import { sendMessage, handleChatAction, clearConversation } from "../controllers/chatController";

const router = Router();

// POST /api/chat - Send question with document reference and conversation history
router.post("/", sendMessage);

// POST /api/chat/action - Run follow-up action on previous message
router.post("/action", handleChatAction);

// DELETE /api/chat - Clear current conversation (without removing document reference)
router.delete("/", clearConversation);

export default router;
