import express from 'express';
import { protectRoute } from '../middleware/auth.middleware.js';
import { getChatList, fetchInitialMessage } from '../controllers/message.controller.js';

const router = express.Router();

// Get dynamic chatlist
router.get("/list", protectRoute, getChatList);

router.get("/messages/:chatId", protectRoute, fetchInitialMessage);

export default router;