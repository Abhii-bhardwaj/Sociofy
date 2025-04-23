import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";
import Comment from "../models/comment.model.js";
import { io } from "../lib/socket.js";
import ShortLink from "../models/shortLink.model.js";

const generateShortCode = () => {
  return Math.random().toString(36).substring(2, 8); // e.g., "abc123"
};

// Get Paginated Posts (unchanged, already has replies.userId population)
export const getPaginatedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // const cacheKey = `posts:page:${page}:limit:${limit}`;
    // const cachedPosts = await redis.get(cacheKey);

    // if (cachedPosts) {
    //   return res.status(200).json({
    //     posts: JSON.parse(cachedPosts),
    //     totalPages: JSON.parse(cachedPosts).totalPages || 1,
    //     currentPage: page,
    //   });
    // }

    const posts = await Post.find()
      .populate("user", "username profilePic")
      .populate({
        path: "comments",
        populate: [
          { path: "userId", select: "username profilePic" },
          { path: "replies.userId", select: "username profilePic" },
        ],
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    // await redis.set(cacheKey, JSON.stringify(posts), "EX", 300);

    res.status(200).json({
      posts,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ message: "Server Error" });
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

export const likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    console.log("Received postId:", postId); // Debug log
    console.log("User ID:", userId);

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const likeIndex = post.likes.findIndex(
      (like) => like.userId.toString() === userId.toString()
    );
    let action;

    if (likeIndex === -1) {
      post.likes.push({ userId });
      action = "liked";
    } else {
      post.likes.splice(likeIndex, 1);
      action = "unliked";
    }

    await post.save();

    // Emit full post to all clients
    const updatedPost = await Post.findById(postId)
      .populate("user", "username profilePic")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
      });
    console.log("Emitting postUpdated:", updatedPost);
    io.emit("postUpdated", updatedPost);

    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.set(`post:${postId}`, JSON.stringify(post), "EX", 3600);

    res.status(200).json({
      message: `Post ${action} successfully`,
      liked: action === "liked",
      likes: post.likes.length,
    });
  } catch (error) {
    console.error("Error toggling like:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const comment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Comment content is required" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = new Comment({
      postId,
      userId,
      content,
      createdAt: new Date(),
      likes: [],
      replies: [],
    });

    await newComment.save();

    // Populate the new comment
    const populatedComment = await Comment.findById(newComment._id)
      .populate("userId", "username profilePic")
      .populate("replies.userId", "username profilePic");

    post.comments.push(newComment._id);
    await post.save();

    // Invalidate cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.del(`post:${postId}`);

    // Emit socket event
    io.emit("commentAdded", { postId, comment: populatedComment });

    res.status(201).json({
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const sharePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const alreadyShared = post.shares.some(
      (share) => share.userId.toString() === userId.toString()
    );
    if (!alreadyShared) {
      post.shares.push({ userId });
      await post.save();

      const updatedPost = await Post.findById(postId)
        .populate("user", "username profilePic")
        .populate({
          path: "comments",
          populate: { path: "userId", select: "username profilePic" },
        });
      io.emit("postUpdated", updatedPost);

      const keys = await redis.keys("posts:page:*:limit:*");
      if (keys.length > 0) await redis.del(keys);
      await redis.set(`post:${postId}`, JSON.stringify(post), "EX", 3600);
    }

    // Generate short URL
    let shortCode;
    let shortLink;
    do {
      shortCode = generateShortCode();
      shortLink = await ShortLink.findOne({ shortCode });
    } while (shortLink); // Ensure unique shortCode

    await new ShortLink({ shortCode, postId }).save();
    const shareUrl = `${process.env.APP_FRONTEND_URL}/s/${shortCode}`; // e.g., "http://localhost:5001/s/abc123"

    console.log("Share URL:", shareUrl);
    res.status(200).json({
      message: "Post ready to share",
      shareUrl,
      shares: post.shares.length,
    });
  } catch (error) {
    console.error("Error sharing post:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const shortCode = async (req, res) => {
  try {
    const { shortCode } = req.params;
    const shortLink = await ShortLink.findOne({ shortCode });
    if (!shortLink) {
      return res.status(404).send("Link not found");
    }

    const post = await Post.findById(shortLink.postId)
      .populate("user", "username profilePic")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
      });

    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.status(200).json({
      post,
      message: "Post fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching short link:", error.message);
    res.status(500).send("Server Error");
  }
};

export const getSharedPost = async (req, res) => {
  try {
    const { postId } = req.params;
    const post = await Post.findById(postId)
      .populate("user", "username profilePic")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "username profilePic" },
      });

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({
      post,
      message: "Post fetched successfully",
    });
  } catch (error) {
    console.error("Error fetching post:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

export const savePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user._id;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Check if user has already saved this post
    // Using findIndex to check if the user's ID exists in the saves array
    const savedIndex = post.saved.findIndex(
      (item) => item.userId && item.userId.toString() === userId.toString()
    );

    let action;

    if (savedIndex === -1) {
      // User hasn't saved this post yet, use MongoDB's update operator to add to the saves array
      await Post.findByIdAndUpdate(postId, {
        $push: {
          saved: {
            userId: userId,
            savedAt: new Date(),
          },
        },
      });
      action = "saved";
    } else {
      // User has already saved this post, use MongoDB's update operator to remove from the saves array
      await Post.findByIdAndUpdate(postId, {
        $pull: {
          saved: {
            userId: userId,
          },
        },
      });
      action = "unsaved";
    }

    // Clear any cached post data
    await redis.del(`post:${postId}`);

    res.status(200).json({
      message: `Post ${action} successfully`,
      saved: action === "saved",
    });
  } catch (error) {
    console.error("Error toggling save:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Add Reply to a Comment
export const addReply = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Reply content is required" });
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const reply = {
      userId,
      content,
      createdAt: new Date(),
      likes: [],
    };

    comment.replies.push(reply);
    await comment.save();

    // Populate the comment and its replies' user data
    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "username profilePic")
      .populate("replies.userId", "username profilePic");

    // Invalidate cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.del(`post:${postId}`);

    // Emit socket event
    io.emit("commentUpdated", { postId, comment: updatedComment });

    res.status(201).json({
      message: "Reply added successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error adding reply:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Only comment creator or post creator can delete
    if (
      comment.userId.toString() !== userId &&
      post.user.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete comment" });
    }

    await Comment.findByIdAndDelete(commentId);

    // Remove comment from post
    post.comments = post.comments.filter(
      (id) => id.toString() !== commentId.toString()
    );
    await post.save();

    // Invalidate cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.del(`post:${postId}`);

    // Emit socket event
    io.emit("commentDeleted", { postId, commentId });

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Like/Unlike Comment
export const likeComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure likes is an array
    if (!Array.isArray(comment.likes)) {
      comment.likes = [];
    }

    const likeIndex = comment.likes.findIndex(
      (likeId) => likeId.toString() === userId.toString()
    );
    let action;

    if (likeIndex === -1) {
      comment.likes.push(userId);
      action = "liked";
    } else {
      comment.likes.splice(likeIndex, 1);
      action = "unliked";
    }

    await comment.save();

    // Populate the comment and its replies' user data
    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "username profilePic")
      .populate("replies.userId", "username profilePic");

    // Invalidate cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.del(`post:${postId}`);

    // Emit socket event
    io.emit("commentUpdated", { postId, comment: updatedComment });

    res.status(200).json({
      message: `Comment ${action} successfully`,
      liked: action === "liked",
      comment: updatedComment, // Return full comment object
    });
  } catch (error) {
    console.error("Error liking comment:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Delete Reply
export const deleteReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user._id.toString();

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    // Only reply creator or post creator can delete
    if (reply.userId.toString() !== userId && post.user.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete reply" });
    }

    comment.replies.pull(replyId);
    await comment.save();

    // Populate the comment and its replies' user data
    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "username profilePic")
      .populate("replies.userId", "username profilePic");

    // Invalidate cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.del(`post:${postId}`);

    // Emit socket event
    io.emit("commentUpdated", { postId, comment: updatedComment });

    res.status(200).json({ message: "Reply deleted successfully" });
  } catch (error) {
    console.error("Error deleting reply:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};

// Like/Unlike Reply
// Like/Unlike Reply
export const likeReply = async (req, res) => {
  try {
    const { postId, commentId, replyId } = req.params;
    const userId = req.user._id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const reply = comment.replies.id(replyId);
    if (!reply) {
      return res.status(404).json({ message: "Reply not found" });
    }

    if (!Array.isArray(reply.likes)) {
      reply.likes = [];
    }

    const likeIndex = reply.likes.findIndex(
      (likeId) => likeId.toString() === userId.toString()
    );
    let action;

    if (likeIndex === -1) {
      reply.likes.push(userId);
      action = "liked";
    } else {
      reply.likes.splice(likeIndex, 1);
      action = "unliked";
    }

    await comment.save();

    // Populate the comment and its replies' user data
    const updatedComment = await Comment.findById(commentId)
      .populate("userId", "username profilePic")
      .populate("replies.userId", "username profilePic");

    // Invalidate cache
    const keys = await redis.keys("posts:page:*:limit:*");
    if (keys.length > 0) await redis.del(keys);
    await redis.del(`post:${postId}`);

    // Emit socket event
    io.emit("commentUpdated", { postId, comment: updatedComment });

    res.status(200).json({
      message: `Reply ${action} successfully`,
      liked: action === "liked",
      likes: reply.likes,
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error liking reply:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
