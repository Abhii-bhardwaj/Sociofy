import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getPaginatedPosts, deletePost, editPost } from "../controllers/post.controller.js"; // Ensure this exists
import { uploadMultiple } from "../middleware/multer.js";

const router = express.Router();

router.get("/fetch-post", getPaginatedPosts); // ✅ Paginated posts

router.delete("/delete/:postId", protectRoute, deletePost);
router.put("/:postId", protectRoute, uploadMultiple, editPost);

export default router;
