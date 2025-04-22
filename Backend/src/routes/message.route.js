import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getChatList,
  sendMessage,
  deleteMessage,
  markMessageAsRead,
  getUndeliveredMessages,
  getChatSuggestions,
  fetchInitialMessages,
  getOnlineUsers,
} from "../controllers/message.controller.js";

const router = express.Router();

// Get dynamic chatlist
router.get("/list", protectRoute, getChatList);

router.get("/messages/:chatId", protectRoute, fetchInitialMessages);

router.post("/send", protectRoute, sendMessage);

router.put("/read/:messageId", protectRoute, markMessageAsRead);

// Delete a message (Soft Delete)
router.delete("/:messageId", protectRoute, deleteMessage);

// Get undelivered messages when user comes online
router.get("/undelivered", protectRoute, getUndeliveredMessages);

// Get chat suggestions for new users
router.get("/suggestions", protectRoute, getChatSuggestions);

//Get online Users
router.get("/online", protectRoute, getOnlineUsers);
// --- END ADD ---

export default router;
