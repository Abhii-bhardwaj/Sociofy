import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  getPaginatedPosts,
  deletePost,
  editPost,
  likePost,
  savePost,
  comment,
  sharePost,
  shortCode,
  getSharedPost,
  addReply,
  deleteComment,
  likeComment,
  deleteReply,
  likeReply,
} from "../controllers/post.controller.js"; // Ensure this exists
import { uploadMultiple } from "../middleware/multer.js";

const router = express.Router();

router.get("/fetch-post", getPaginatedPosts); // ✅ Paginated posts

router.put("/:postId", protectRoute, uploadMultiple, editPost);

router.delete("/delete/:postId", protectRoute, deletePost);

router.post("/:postId/like", protectRoute, likePost);

router.post("/:postId/comment", protectRoute, comment);

router.post("/:postId/share",protectRoute, sharePost);

router.get('/:postId', getSharedPost)

router.get("/s/:shortCode", shortCode);

router.post("/:postId/save", protectRoute, savePost);

router.post("/:postId/comment/:commentId/reply", protectRoute, addReply);
router.delete("/:postId/comment/:commentId", protectRoute, deleteComment);
router.post("/:postId/comment/:commentId/like", protectRoute, likeComment);
router.post(
  "/:postId/comment/:commentId/reply/:replyId/like",
  protectRoute,
  likeReply
); // New
router.delete(
  "/:postId/comment/:commentId/reply/:replyId",
  protectRoute,
  deleteReply
);

export default router;
