import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import { redis } from "../lib/redis.js";
import { v2 as cloudinary } from "cloudinary";
import { io } from "../lib/socket.js";
import bcrypt from "bcryptjs";

const DEFAULT_PROFILE_PIC =
  "https://www.google.com/url?sa=i&url=https%3A%2F%2Fe-quester.com%2Fplaceholder-image-person-jpg-1%2F&psig=AOvVaw1sHdbOj9HfzBun11x5jImZ&ust=1741501907452000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCIDEjavu-YsDFQAAAAAdAAAAABAJ";

export const searchUser = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || query.trim().length < 1) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: "i" } },
        { fullName: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user.userId }, // Exclude current user
    })
      .select("username fullName profilePic followers")
      .limit(10);

    const results = users.map((user) => ({
      username: user.username, // Changed from id to username
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
    const { username } = req.params;
    console.log("Fetching profile for username:", username);

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    })
      .select("-password -otp -googleId") // Exclude sensitive fields
      .populate("followers", "username profilePic") // Update populate to username
      .populate("following", "username profilePic");

    console.log("Found user:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Customize response to avoid exposing _id
    const response = {
      username: user.username,
      fullName: user.fullName,
      profilePic: user.profilePic,
      followers: user.followers, // Already populated with username/profilePic
      following: user.following, // Already populated with username/profilePic
      followerCount: user.followers.length,
      followingCount: user.following.length,
      _id: user._id,
      // Add other fields as needed
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getProfileUserPosts = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const cacheKey = `posts:user:${username}:page:${page}:limit:${limit}`;
    const cachedPosts = await redis.get(cacheKey);
    if (cachedPosts) {
      console.log("Serving posts from cache");
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    // Find user by username
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 }) // Latest posts first
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "username fullName profilePic");

    const totalPosts = await Post.countDocuments({ user: user._id });
    const response = {
      posts,
      totalPosts,
      page: parseInt(page),
      totalPages: Math.ceil(totalPosts / limit),
    };

    await redis.setEx(cacheKey, 3600, JSON.stringify(response)); // Cache for 1 hour
    console.log(`Fetched posts for user ${username}`);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching user posts:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded!" });

    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found!" });

    if (user.profilePic && user.profilePic.includes("res.cloudinary.com")) {
      const publicId = user.profilePic.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(`profile_pics/${publicId}`);
    }

    const profilePictureUrl = req.file.path;
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: profilePictureUrl },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ error: "User not found!" });

    await redis.del(`user:${userId}`);

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

// Create Post with Cache Invalidation
export const createPost = async (req, res) => {
  try {
    const userId = req.user._id; // From protectRoute middleware
    const { caption } = req.body;
    let imageUrls = [];

    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map((file) => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    const newPost = new Post({
      user: userId,
      caption: caption || "",
      postImage: imageUrls,
      createdAt: new Date(),
    });

    await newPost.save();

    // Invalidate all paginated posts cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) {
      await redis.del(keys);
      console.log("Cache invalidated for paginated posts");
    }

    // Fetch the newly created post with populated data
    const populatedPost = await Post.findById(newPost._id)
      .populate("user", "username profilePic")
      .lean();

    res.status(201).json({
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    console.error("Error creating post:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, bio } = req.body;

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

    if (bio) user.bio = bio;

    await user.save();
    await redis.del(`user:${userId}`);

    const { password: _, ...userWithoutPassword } = user._doc;
    res.status(200).json({
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized - No user data" });
    }

    const { userId } = req.params;
    const currentUser = req.user._id.toString();

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

    userToFollow.followers.push(currentUser);
    userFollowing.following.push(userId);
    await userToFollow.save();
    await userFollowing.save();

    // Update Redis Cache
    const loggedInUsername = userFollowing.username;
    const followedUsername = userToFollow.username;
    const followingCacheKey = `following:${loggedInUsername}:page:1:limit:10`;
    const followersCacheKey = `followers:${followedUsername}:page:1:limit:10`;

    // Fetch updated lists
    const updatedFollowing = await User.find({
      _id: { $in: userFollowing.following },
    }).select("username fullName profilePic _id");
    const updatedFollowers = await User.find({
      _id: { $in: userToFollow.followers },
    }).select("username fullName profilePic _id");

    // Define response objects for cache and socket
    const followingResponse = {
      following: updatedFollowing,
      totalFollowing: userFollowing.following.length,
      page: 1,
      totalPages: Math.ceil(userFollowing.following.length / 10),
    };
    const followersResponse = {
      followers: updatedFollowers,
      totalFollowers: userToFollow.followers.length,
      page: 1,
      totalPages: Math.ceil(userToFollow.followers.length / 10),
    };

    // Set cache
    await redis.setEx(
      followingCacheKey,
      3600,
      JSON.stringify(followingResponse)
    );
    await redis.setEx(
      followersCacheKey,
      3600,
      JSON.stringify(followersResponse)
    );
    await redis.del(`user:${currentUser}`);
    await redis.del(`user:${userId}`);

    console.log(
      `🗑️ Updated cache for ${followingCacheKey} and ${followersCacheKey}`
    );

    // Emit Socket Events with correct data
    io.emit("followUpdate", {
      followerId: currentUser,
      followingId: userId,
      following: followingResponse.following,
      followers: followersResponse.followers,
    });

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
    const currentUser = req.user._id.toString();

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

    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser
    );
    userFollowing.following = userFollowing.following.filter(
      (id) => id.toString() !== userId
    );

    await userToUnfollow.save();
    await userFollowing.save();

    // Update Redis Cache
    const loggedInUsername = userFollowing.username;
    const unfollowedUsername = userToUnfollow.username;
    const followingCacheKey = `following:${loggedInUsername}:page:1:limit:10`;
    const followersCacheKey = `followers:${unfollowedUsername}:page:1:limit:10`;

    const updatedFollowing = await User.find({
      _id: { $in: userFollowing.following },
    }).select("username fullName profilePic _id");
    const updatedFollowers = await User.find({
      _id: { $in: userToUnfollow.followers },
    }).select("username fullName profilePic _id");

    // Define response objects for cache and socket
    const followingResponse = {
      following: updatedFollowing,
      totalFollowing: userFollowing.following.length,
      page: 1,
      totalPages: Math.ceil(userFollowing.following.length / 10),
    };
    const followersResponse = {
      followers: updatedFollowers,
      totalFollowers: userToUnfollow.followers.length,
      page: 1,
      totalPages: Math.ceil(userToUnfollow.followers.length / 10),
    };

    await redis.setEx(
      followingCacheKey,
      3600,
      JSON.stringify(followingResponse)
    );
    await redis.setEx(
      followersCacheKey,
      3600,
      JSON.stringify(followersResponse)
    );
    await redis.del(`user:${currentUser}`);
    await redis.del(`user:${userId}`);

    console.log(
      `🗑️ Updated cache for ${followingCacheKey} and ${followersCacheKey}`
    );

    // Emit Socket Events with correct data
    io.emit("unfollowUpdate", {
      followerId: currentUser,
      followingId: userId,
      following: followingResponse.following,
      followers: followersResponse.followers,
    });

    res.status(200).json({ message: "Unfollowed successfully" });
  } catch (error) {
    console.error("🚨 Unfollow user error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const fetchFollowers = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const cacheKey = `followers:${username}:page:${page}:limit:${limit}`;
    const cachedFollowers = await redis.get(cacheKey);
    if (cachedFollowers) {
      console.log("Serving followers from cache");
      return res.status(200).json(JSON.parse(cachedFollowers));
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    }).select("followers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const loggedInUser = await User.findById(req.user._id).select("following");
    const loggedInFollowing = loggedInUser
      ? loggedInUser.following.map((id) => id.toString())
      : [];

    const followers = await User.find({
      _id: { $in: user.followers },
    })
      .select("username fullName profilePic _id")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalFollowers = user.followers.length;
    const response = {
      followers: followers.map((f) => ({
        _id: f._id,
        username: f.username,
        fullName: f.fullName,
        profilePic: f.profilePic,
        isFollowing: loggedInFollowing.includes(f._id.toString()),
      })),
      totalFollowers,
      page: parseInt(page),
      totalPages: Math.ceil(totalFollowers / limit),
    };

    await redis.setEx(cacheKey, 3600, JSON.stringify(response));
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching followers:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const fetchFollowing = async (req, res) => {
  try {
    const { username } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const cacheKey = `following:${username}:page:${page}:limit:${limit}`;
    const cachedFollowing = await redis.get(cacheKey);
    if (cachedFollowing) {
      console.log("Serving following from cache");
      return res.status(200).json(JSON.parse(cachedFollowing));
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    }).select("following");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const loggedInUser = await User.findById(req.user._id).select("following");
    const loggedInFollowing = loggedInUser
      ? loggedInUser.following.map((id) => id.toString())
      : [];

    const following = await User.find({
      _id: { $in: user.following },
    })
      .select("username fullName profilePic _id")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const totalFollowing = user.following.length;
    const response = {
      following: following.map((f) => ({
        _id: f._id,
        username: f.username,
        fullName: f.fullName,
        profilePic: f.profilePic,
        isFollowing: loggedInFollowing.includes(f._id.toString()),
      })),
      totalFollowing,
      page: parseInt(page),
      totalPages: Math.ceil(totalFollowing / limit),
    };

    await redis.setEx(cacheKey, 3600, JSON.stringify(response));
    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching following:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const getFollowerSuggestions = async (req, res) => {
  const userId = req.user?._id;

  try {
    if (!userId) {
      return res
        .status(401)
        .json({ message: "Authentication failed: No user ID" });
    }

    const user = await User.findById(userId).select("followers");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const excludedIds = [userId, ...user.followers].map((id) => id.toString());

    const suggestions = await User.find({
      _id: { $nin: excludedIds },
    })
      .limit(10)
      .select("fullName profilePic _id username")
      .lean();

    res.status(200).json(suggestions);
  } catch (error) {
    console.error("Error getting suggestions:", error);
    res.status(500).json({ message: "Server error fetching suggestions" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user._id;
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    // Find user
    const user = await User.findById(userId).select("password googleId");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is OAuth-based (no password)
    if (user.googleId && !user.password) {
      return res
        .status(400)
        .json({ message: "OAuth users cannot change passwords" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Clear Redis cache
    await redis.del(`user:${userId}`);

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Soft delete user
    user.isDeleted = true;
    user.lastActive = new Date(); // Update last active timestamp
    user.savedPosts = []; // Clear saved posts
    user.followers = []; // Clear followers
    user.following = []; // Clear following
    user.chats = []; // Clear chats
    await user.save();

    // Soft delete user's posts
    await Post.updateMany(
      { user: userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );

    // Clear Redis cache
    await redis.del(`user:${userId}`);

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Error deleting account:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const fetchSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id;
    console.log("Fetching saved posts for userId:", userId); // Debug

    // Validate userId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      console.error("Invalid userId:", userId);
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Instead of checking for savedPosts in User, find all posts where this user ID exists in the save array
    const savedPosts = await Post.find({
      "saved.userId": userId,
      isDeleted: { $ne: true },
    })
      .populate("user", "username profilePic") // Changed from userId to user based on your schema
      .lean();

    if (!savedPosts || savedPosts.length === 0) {
      console.log("No saved posts for user:", userId);
      return res.status(200).json({ posts: [] });
    }

    // Format posts for PostCard
    const formattedPosts = savedPosts.map((post) => ({
      _id: post._id.toString(),
      user: {
        _id: post.user?._id?.toString() || "",
        username: post.user?.username || "Unknown",
        profilePic: post.user?.profilePic || "default-user.jpg",
      },
      caption: post.caption || "",
      postImage: Array.isArray(post.postImage) // Changed from images to postImage based on your schema
        ? post.postImage.map((img) => ({ url: img.url || "" }))
        : [],
      createdAt: post.createdAt
        ? post.createdAt.toISOString()
        : new Date().toISOString(),
      likes: Array.isArray(post.likes)
        ? post.likes.map((like) => ({ userId: like.userId.toString() }))
        : [],
      comments: Array.isArray(post.comments) ? post.comments : [],
      shares: Array.isArray(post.shares)
        ? post.shares.map((share) => ({ userId: share.userId.toString() }))
        : [],
      saved: true, // Adding this flag since we know these are saved posts
    }));

    console.log("Fetched saved posts count:", formattedPosts.length); // Debug
    res.status(200).json({ posts: formattedPosts });
  } catch (error) {
    console.error("Error fetching saved posts:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ message: "Server error" });
  }
};