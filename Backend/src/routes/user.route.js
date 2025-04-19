import express from "express";
import { uploadMultiple, uploadSingle } from "../middleware/multer.js";
import {
  searchUser,
  getUserProfile,
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  fetchSavedPosts,
  updateProfilePicture,
  createPost,
  updateProfile,
  getProfileUserPosts,
  getFollowerSuggestions,
  changePassword,
  deleteAccount,
} from "../controllers/user.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import User from '../models/user.model.js'


const router = express.Router();

router.get("/follow/:userId", protectRoute, followUser);
router.get("/unfollow/:userId", protectRoute, unfollowUser);

router.get("/:username/posts", protectRoute, getProfileUserPosts)

router.get("/search", protectRoute, searchUser);

router.get("/profile/:username", protectRoute, getUserProfile);

router.get("/:username/followers", protectRoute, fetchFollowers);
router.get("/:username/following", protectRoute, fetchFollowing);

router.put("/change-password", protectRoute, changePassword)

router.get("/saved-posts", protectRoute, fetchSavedPosts);

router.delete("/delete-account", protectRoute, deleteAccount);

router.get("/suggestions", protectRoute, getFollowerSuggestions);
const debugMulter = (req, res, next) => {
  console.log("Incoming request body:", req.body);
  console.log("Incoming files:", req.files);
  next();
};

router.post(
  "/:userId/create-post",
  protectRoute,
  debugMulter, // Debugging middleware
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

router.get("/:userId", protectRoute, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate("followers", "username profilePic _id")
      .select("followers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
