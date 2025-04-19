// src/server/routes/notification.js
import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  deleteAllNotifications,
  deleteNotification,
  getNotifications,
  markAllAsRead,
} from "../controllers/notification.controller.js";


const router = express.Router();

// Fetch notifications
router.get("/:userId", protectRoute, getNotifications);

// Delete single notification
router.delete("/:id", protectRoute, deleteNotification);

// Delete all notifications
router.delete("/all/:userId", protectRoute, deleteAllNotifications);

router.post("/mark-all-read/:userId", protectRoute, markAllAsRead);

export default router;