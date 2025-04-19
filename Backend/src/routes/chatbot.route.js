import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { ChatbotController } from "../controllers/chatbot.controller.js";

const router = express.Router();

router.post("/support/query", protectRoute, ChatbotController);

export default router;