import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { adminAuth } from "../middleware/admin.middleware.js";
import {
  getStats,
  getUsers,
  updateUser,
  deleteUser,
  getPosts,
  updatePost,
  deletePost,
  getNotifications,
  createSystemNotification,
  deleteNotification,
  getSettings,
  updateSettings,
  regenerateJwtSecret,
} from "../controllers/admin.controller.js";

const router = express.Router();

// All routes are protected with authentication and admin authorization
// router.use(protectRoute, adminAuth);

// Stats route
router.get("/stats", protectRoute,adminAuth, getStats);

// User routes
router.get("/users",protectRoute,adminAuth, getUsers);
router.put("/users/:id",protectRoute,adminAuth, updateUser);
router.delete("/users/:id",protectRoute,adminAuth, deleteUser);

// Post routes
router.get("/posts",protectRoute,adminAuth, getPosts);
router.put("/posts/:id",protectRoute,adminAuth, updatePost);
router.delete("/posts/:id",protectRoute,adminAuth, deletePost);

// Notification routes
router.get("/notifications",protectRoute,adminAuth, getNotifications);
router.post(
  "/notifications",
  protectRoute,
  adminAuth,
  createSystemNotification
);
router.delete("/notifications/:id",protectRoute,adminAuth, deleteNotification);

// Settings routes
router.get("/settings",protectRoute,adminAuth, getSettings);
router.put("/settings",protectRoute,adminAuth, updateSettings);
router.post("/jwt/regenerate",protectRoute,adminAuth, regenerateJwtSecret);

export default router;
