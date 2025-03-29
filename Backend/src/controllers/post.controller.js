import Post from "../models/post.model.js";
import { redis } from "../lib/redis.js";

export const getPaginatedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const cacheKey = `posts:page:${page}:limit:${limit}`;

    const cachedPosts = await redis.get(cacheKey);
    if (cachedPosts) {
      console.log(`Cache hit for ${cacheKey}`);
      return res.status(200).json(JSON.parse(cachedPosts));
    }

    // Cache miss - Fetch from database
    const posts = await Post.find({ isDeleted: false })
      .populate("user", "username profilePic")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }); // Latest posts first
    
    const totalPosts = await Post.countDocuments({ isDeleted: false });
    const totalPages = Math.ceil(totalPosts / limit);

    const response = {
      posts,
      pagination: { page, limit, totalPosts, totalPages },
    };

    await redis.set(cacheKey, JSON.stringify(response), "EX", 3600);
    console.log(`Cache set for ${cacheKey}`);

    res.status(200).json(response);
    
  } catch (error) {
    console.error("Error in getPaginatedPosts:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id.toString(); // Logged-in user ID from protectRoute

    // ✅ Debug: Log incoming data
    console.log("Deleting postId:", postId);
    console.log("Logged-in userId:", userId);

    // ✅ Find the post
    const post = await Post.findById(postId);
    console.log("Found post:", post); // Debug: Check post data

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // ✅ Check if post.user exists and compare
    if (!post.user) {
      console.error("Post has no user field:", post);
      return res
        .status(500)
        .json({ message: "Post data is corrupted: missing user" });
    }

    if (post.user.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "You can only delete your own posts" });
    }

    // ✅ Delete the post
    await Post.findByIdAndDelete(postId);

    // ✅ Clear Redis cache (optional)
    await redis.del(`post:${postId}`);
    await redis.del(`user:${userId}:posts`);

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("🚨 Delete post error:", error);
    res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

export const editPost = async (req, res) => {
  const { postId } = req.params;
  const userId = req.user._id.toString();
  const post = await Post.findById(postId);
  if (!post) return res.status(404).json({ message: "Post not found" });
  if (post.user.toString() !== userId)
    return res
      .status(403)
      .json({ message: "You can only edit your own posts" });

  const { caption } = req.body;
  console.log("Received caption from frontend:", caption); // ✅ Yeh check karo
  console.log("Received files:", req.files); // ✅ Files check karo

  let imageUrls = post.postImage;
  if (req.files && req.files.length > 0) {
    imageUrls = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
  }

  // Explicit update
  await Post.updateOne(
    { _id: postId },
    { $set: { caption: caption || post.caption, postImage: imageUrls } }
  );

  // Fetch updated post
  const updatedPost = await Post.findByIdAndUpdate(
    postId,
    { $set: { caption: caption || post.caption, postImage: imageUrls } }, // ✅ Explicit set
    { new: true }
  ).populate("user");
  console.log("Updated post from DB:", updatedPost);

  // Redis Update
  await redis.del(`post:${postId}`);
  await redis.set(`post:${postId}`, JSON.stringify(updatedPost), "EX", 3600);
  const keys = await redis.keys("posts:page:*:limit:*");
  if (keys.length > 0) await redis.del(keys);
  await redis.del(`user:${userId}:posts`);

  res
    .status(200)
    .json({ message: "Post updated successfully ✅", post: updatedPost });
};