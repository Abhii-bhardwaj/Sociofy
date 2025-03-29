import User from "../models/user.model.js"; 
import Post from "../models/post.model.js";
import { redis } from "../lib/redis.js";
import { v2 as cloudinary } from "cloudinary";


const DEFAULT_PROFILE_PIC = "https://www.google.com/url?sa=i&url=https%3A%2F%2Fe-quester.com%2Fplaceholder-image-person-jpg-1%2F&psig=AOvVaw1sHdbOj9HfzBun11x5jImZ&ust=1741501907452000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIDEjavu-YsDFQAAAAAdAAAAABAJ"

export const searchUser = async (req, res) => {
  try {
    const { query } = req.query; // e.g., ?query=tes
    if (!query || query.trim().length < 1) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Case-insensitive search on username or fullName
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user.userId }, // Exclude the current user
    })
      .select("username fullName profilePic followers")
      .limit(10); // Limit to 10 results for performance

    const results = users.map((user) => ({
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
      followerCount: user.followers.length,
    }));

    res.status(200).json(results);
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserProfile = async (req, res) => { 
  try {
    const { userId } = req.params;
    console.log("Fetching profile for userId:", userId);
    const user = await User.findById(userId)
      .select("-password -otp -googleId")
      .populate("followers", "fullName profilePic")
      .populate("following", "fullName profilePic");
    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
}

export const updateProfilePicture = async (req, res) => {
  try {
    // ✅ Check if file is uploaded
    if (!req.file) return res.status(400).json({ error: "No file uploaded!" });

    console.log("Authenticated User:", req.user); // Debugging User

    // ✅ Ensure `req.user.id` or `_id` is correct
    const userId = req.user.id || req.user._id;

    // ✅ Check if old profile picture exists on Cloudinary
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found!" });

    if (user.profilePic && user.profilePic.includes("res.cloudinary.com")) {
      // ✅ Delete old profile picture from Cloudinary
      const publicId = user.profilePic.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
    }

    // ✅ Get Cloudinary Uploaded File URL
    const profilePictureUrl = req.file.path;

    // ✅ Update User Profile Picture in DB
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: profilePictureUrl },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found!" });

    // ✅ Clear Old Cache from Redis
    await redis.del(`user:${userId}`);

    // ✅ Send Success Response
    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully!",
      profilePicture: updatedUser.profilePic,
    });
  } catch (error) {
    console.error("Error updating profile picture:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const createPost = async (req, res) => {
  try {
    console.log("User from request:", req.user); // Debugging user object
    if (!req.user) {
      return res.status(400).json({ message: "User is not authenticated" });
    }

    console.log("Files received:", req.files); // Debug
    console.log("Body received:", req.body); // Debug
    const imageUrls = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    const { caption, tags, location, visibility } = req.body;

    const newPost = await Post.create({
      user: req.user._id, // Ensure user is added from req.user
      postImage: imageUrls,
      caption,
      tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
      location,
      visibility: visibility || "Public",
    });

    await User.findByIdAndUpdate(req.user._id, {
      $push: { posts: newPost._id },
    });

    res.status(201).json({
      message: "Post Created Successfully ✅",
      post: newPost,
    });
  } catch (error) {
    console.error("Error in createPost controller:", error.message);
    res.status(500).json({
      message: "Server Error 🚨",
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, bio, fullName, dob } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      user.username = username;
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: "Email is already in use" });
      }
      user.email = email;
    }

    if (fullName) user.fullName = fullName;
    if (bio) user.bio = bio;
    if (dob) user.dob = new Date(dob);

    await user.save();

    // Invalidate Redis cache instead of setting it
    await redis.del(`user:${userId}`);

    const { password: _, ...userWithoutPassword } = user._doc;
    res
      .status(200)
      .json({
        message: "Profile updated successfully",
        user: userWithoutPassword,
      });
  } catch (error) {
    console.error("Error in updateProfile:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

export const followUser = async (req, res) => {
  try {
    console.log("🔍 Checking `req.user`:", req.user);

    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized - No user data" });
    }

    const { userId } = req.params; // User to be followed
    const currentUser = req.user._id.toString(); // Logged-in user

    console.log("✅ Logged-in User ID:", currentUser);
    console.log("✅ User to Follow ID:", userId);

    if (currentUser === userId) {
      return res.status(400).json({ message: "You can't follow yourself" });
    }

    const userToFollow = await User.findById(userId);
    const userFollowing = await User.findById(currentUser);

    if (!userToFollow || !userFollowing) {
      return res.status(404).json({ message: "User not found" });
    }

    if (userToFollow.followers.includes(currentUser)) {
      return res.status(400).json({ message: "Already following" });
    }

    // ✅ Add follower & following
    userToFollow.followers.push(currentUser);
    userFollowing.following.push(userId);
    await userToFollow.save();
    await userFollowing.save();

    // ✅ Clear Redis Cache
    await redis.del(`user:${currentUser}`);
    await redis.del(`user:${userId}`);

    res.status(200).json({ message: "Followed successfully" });
  } catch (error) {
    console.error("🚨 Follow user error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUser = req.user._id;

    if (currentUser === userId) {
      return res.status(400).json({ message: "You can't unfollow yourself" });
    }

    const userToUnfollow = await User.findById(userId);
    const userFollowing = await User.findById(currentUser);

    if (!userToUnfollow || !userFollowing) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!userToUnfollow.followers.includes(currentUser)) {
      return res
        .status(400)
        .json({ message: "You are not following this user" });
    }

    // ✅ Remove follower & following
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser
    );
    userFollowing.following = userFollowing.following.filter(
      (id) => id.toString() !== userId
    );

    await userToUnfollow.save();
    await userFollowing.save();

    // ✅ Clear Redis Cache
await redis.del(`user:${currentUser}`);
await redis.del(`user:${userId}`);

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

