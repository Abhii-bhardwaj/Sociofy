import express from "express";
import { uploadMultiple, uploadSingle } from "../middleware/multer.js";
import {
  searchUser,
  getUserProfile,
  followUser,
  unfollowUser,
  updateProfilePicture,
  createPost,
  updateProfile,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/follow/:userId", protectRoute, followUser);
router.get("/unfollow/:userId", protectRoute, unfollowUser);

router.get("/search", protectRoute, searchUser);

router.get("/profile/:userId", protectRoute, getUserProfile);

const debugMulter = (req, res, next) => {
  console.log("Incoming request body:", req.body);
  console.log("Incoming files:", req.files);
  next();
};

router.post(
  "/:userId/create-post",
  protectRoute,
  debugMulter,  // Debugging middleware
  uploadMultiple,
  createPost
);

router.put(
  "/update-profile-picture",
  protectRoute,
  uploadSingle,
  updateProfilePicture
);

router.put("/update-profile", protectRoute, updateProfile);

export default router;
