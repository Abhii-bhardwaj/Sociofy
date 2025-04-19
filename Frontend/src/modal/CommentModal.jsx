import React, { useState, useCallback, useRef, useEffect } from "react";
import { Heart, BookmarkPlus, Trash2 } from "lucide-react";
import { IoIosShareAlt } from "react-icons/io";
import EmblaCarousel from "../components/EmblaCarousel";
import { usePostStore } from "../store/usePostStore";
import useUser from "../hooks/useUser.hook";
import toast from "react-hot-toast";
import debounce from "lodash/debounce"; // Install lodash for debouncing

// Separate ReplyInput Component for Isolation
const ReplyInput = ({ commentId, postId, addReply, user, onCancel }) => {
  const [replyContent, setReplyContent] = useState("");
  const textareaRef = useRef(null);

  // Debounce state updates to reduce re-renders
  const debouncedSetReply = useCallback(
    debounce((value) => {
      setReplyContent(value);
    }, 100),
    []
  );

  // Handle textarea change
  const handleChange = (e) => {
    const value = e.target.value;
    debouncedSetReply(value);
  };

  // Maintain cursor position
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.focus();
      const length = replyContent.length;
      textarea.setSelectionRange(length, length); // Keep cursor at end
    }
  }, [replyContent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) {
      toast.error("Please login to reply");
      return;
    }
    if (!replyContent.trim()) {
      toast.error("Reply cannot be empty");
      return;
    }
    try {
      await addReply(postId, commentId, replyContent);
      setReplyContent("");
      onCancel(); // Close reply input after submission
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error("Failed to add reply");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-2">
      <textarea
        ref={textareaRef}
        value={replyContent}
        onChange={handleChange}
        placeholder="Write a reply..."
        className="textarea textarea-bordered w-full text-sm"
        rows={2}
        autoFocus
      />
      <button type="submit" className="btn btn-primary btn-sm">
        Reply
      </button>

    </form>
  );
};

const CommentModal = ({
  postId,
  images = [],
  userId,
  profilePic,
  userName,
  content,
  likes: initialLikes = [],
  comments: initialComments = [],
  shares: initialShares = [],
  onClose,
}) => {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState(null); // Track which comment is being replied to
  const {
    posts,
    Like,
    addComment,
    Save,
    sharePost,
    addReply,
    deleteComment,
    likeComment,
    deleteReply,
    likeReply,
  } = usePostStore();
  const user = useUser();

  const currentPost = posts.find((post) => post._id === postId) || {
    likes: initialLikes,
    comments: initialComments,
    shares: initialShares,
    user: {
      _id: userId,
      profilePic: profilePic || "default-user.jpg",
      username: userName || "Unknown",
    },
  };
  const likes = Array.isArray(currentPost.likes)
    ? currentPost.likes
    : initialLikes;
  const comments = Array.isArray(currentPost.comments)
    ? currentPost.comments
    : initialComments;
  const shares = Array.isArray(currentPost.shares)
    ? currentPost.shares
    : initialShares;
  const isLiked =
    user?._id && Array.isArray(likes)
      ? likes.some((like) => like && like.toString() === user._id.toString())
      : false;
  const [bookmarked, setBookmarked] = useState(false);

  const handleToggleLike = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to like this post");
      return;
    }
    try {
      await Like(postId);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error("Failed to like post");
    }
  }, [user, postId, Like]);

  const handleAddComment = useCallback(
    async (e) => {
      e.preventDefault();
      if (!user?._id) {
        toast.error("Please login to comment");
        return;
      }
      if (!newComment.trim()) {
        toast.error("Comment cannot be empty");
        return;
      }
      try {
        await addComment(postId, newComment);
        setNewComment("");
      } catch (error) {
        console.error("Error adding comment:", error);
        toast.error("Failed to add comment");
      }
    },
    [user, postId, newComment, addComment]
  );

  const handleToggleSave = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to save this post");
      return;
    }
    try {
      const saved = await Save(postId);
      setBookmarked(saved);
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error("Failed to save post");
    }
  }, [user, postId, Save]);

  const handleShare = useCallback(async () => {
    if (!user?._id) {
      toast.error("Please login to share this post");
      return;
    }
    try {
      await sharePost(postId);
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Failed to share post");
    }
  }, [user, postId, sharePost]);

  const handleReplyToggle = useCallback(
    (commentId) => {
      setReplyingTo(replyingTo === commentId ? null : commentId);
    },
    [replyingTo]
  );

  const handleDeleteComment = useCallback(
    async (commentId) => {
      if (!user?._id) {
        toast.error("Please login to delete comments");
        return;
      }
      if (window.confirm("Are you sure you want to delete this comment?")) {
        try {
          await deleteComment(postId, commentId);
        } catch (error) {
          console.error("Error deleting comment:", error);
          toast.error("Failed to delete comment");
        }
      }
    },
    [user, postId, deleteComment]
  );

  const handleLikeComment = useCallback(
    async (commentId) => {
      if (!user?._id) {
        toast.error("Please login to like comments");
        return;
      }
      try {
        await likeComment(postId, commentId);
      } catch (error) {
        console.error("Failed to like comment:", error);
        toast.error("Failed to like comment");
      }
    },
    [user, postId, likeComment]
  );

  const handleLikeReply = useCallback(
    async (commentId, replyId) => {
      if (!user?._id) {
        toast.error("Please login to like replies");
        return;
      }
      try {
        await likeReply(postId, commentId, replyId);
      } catch (error) {
        console.error("Failed to like reply:", error);
        toast.error("Failed to like reply");
      }
    },
    [user, postId, likeReply]
  );

  const handleDeleteReply = useCallback(
    async (commentId, replyId) => {
      if (!user?._id) {
        toast.error("Please login to delete replies");
        return;
      }
      if (window.confirm("Are you sure you want to delete this reply?")) {
        try {
          await deleteReply(postId, commentId, replyId);
        } catch (error) {
          console.error("Error deleting reply:", error);
          toast.error("Failed to delete reply");
        }
      }
    },
    [user, postId, deleteReply]
  );

  return (
    <div className="fixed inset-0 bg-base-300 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-base-100 text-base-content w-full max-w-4xl rounded-lg flex flex-row overflow-hidden max-h-[90vh] shadow-xl">
        {/* Left Section: Post Image */}
        <div className="w-1/2 bg-base-200 flex items-center justify-center">
          {images.length > 1 ? (
            <EmblaCarousel images={images} />
          ) : (
            <img
              src={images[0]?.url || "fallback.jpg"}
              alt="Post"
              className="max-h-[90vh] w-full object-contain rounded-l-lg"
            />
          )}
        </div>

        {/* Right Section: Post Data & Comments */}
        <div className="w-1/2 flex flex-col">
          {/* Header: Post Creator's Profile & Caption */}
          <div className="p-4 border-b border-base-300 relative">
            <div className="flex items-center gap-3">
              <img
                src={currentPost.user?.profilePic || "default-user.jpg"}
                alt="User"
                className="w-12 h-12 rounded-full object-cover border border-primary"
              />
              <div>
                <p className="text-sm font-semibold">
                  {currentPost.user?.username || "Unknown"}
                </p>
                <p className="text-sm text-base-content/80">
                  {content || "No caption"}
                </p>
              </div>
            </div>
            <button
              className="absolute top-4 right-4 btn btn-ghost btn-circle btn-sm"
              onClick={onClose}>
              ✕
            </button>
          </div>

          {/* Likes Count */}
          <div className="px-4 py-2 text-sm">
            {likes.length} {likes.length === 1 ? "like" : "likes"}
          </div>

          {/* Comments List */}
          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
            {comments.length > 0 ? (
              comments.map((comment) => {
                const canDelete =
                  user?._id &&
                  (user._id.toString() === comment.userId?._id?.toString() ||
                    user._id.toString() === currentPost.user?._id?.toString());
                const isCommentLiked =
                  user?._id &&
                  Array.isArray(comment.likes) &&
                  comment.likes.some(
                    (likeId) =>
                      likeId && likeId.toString() === user._id.toString()
                  );

                return (
                  <div key={comment._id} className="flex items-start gap-3">
                    <img
                      src={comment.userId?.profilePic || "default-user.jpg"}
                      alt="User"
                      className="w-8 h-8 rounded-full object-cover border border-base-300"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold">
                          {comment.userId?.username || "Unknown"}
                        </p>
                        <p className="text-xs text-base-content/60">
                          {comment.createdAt
                            ? new Date(comment.createdAt).toLocaleString()
                            : "Unknown"}
                        </p>
                      </div>
                      <p className="text-sm">
                        {comment.content || "No content"}
                      </p>
                      <div className="flex gap-2 items-center mt-1">
                        <button
                          onClick={() => handleReplyToggle(comment._id)}
                          className="text-xs text-primary hover:text-primary-focus">
                          {replyingTo === comment._id ? "Cancel" : "Reply"}
                        </button>
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="btn btn-ghost btn-xs text-error hover:text-error-focus">
                            <Trash2 size={14} />
                          </button>
                        )}
                        <button
                          onClick={() => handleLikeComment(comment._id)}
                          className={`btn btn-ghost btn-xs flex items-center gap-1 ${
                            isCommentLiked
                              ? "text-error"
                              : "text-base-content/60 hover:text-error"
                          }`}>
                          <Heart
                            size={14}
                            fill={isCommentLiked ? "currentColor" : "none"}
                          />
                          {Array.isArray(comment.likes)
                            ? comment.likes.length
                            : 0}
                        </button>
                      </div>

                      {/* Reply Input */}
                      {replyingTo === comment._id && (
                        <ReplyInput
                          commentId={comment._id}
                          postId={postId}
                          addReply={addReply}
                          user={user}
                          onCancel={() => setReplyingTo(null)}
                        />
                      )}

                      {/* Replies List */}
                      {Array.isArray(comment.replies) &&
                        comment.replies.length > 0 && (
                          <div className="ml-6 mt-2 space-y-2">
                            {comment.replies.map((reply) => {
                              const canDeleteReply =
                                user?._id &&
                                (user._id.toString() ===
                                  reply.userId?._id?.toString() ||
                                  user._id.toString() ===
                                    currentPost.user?._id?.toString());
                              const isReplyLiked =
                                user?._id &&
                                Array.isArray(reply.likes) &&
                                reply.likes.some(
                                  (likeId) =>
                                    likeId &&
                                    likeId.toString() === user._id.toString()
                                );

                              return (
                                <div
                                  key={reply._id}
                                  className="flex items-start gap-3">
                                  <img
                                    src={
                                      reply.userId?.profilePic ||
                                      "default-user.jpg"
                                    }
                                    alt="User"
                                    className="w-6 h-6 rounded-full object-cover border border-base-300"
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs font-semibold">
                                        {reply.userId?.username ||
                                          "Unknown User"}
                                      </p>
                                      <p className="text-xs text-base-content/60">
                                        {reply.createdAt
                                          ? new Date(
                                              reply.createdAt
                                            ).toLocaleString()
                                          : "Unknown"}
                                      </p>
                                    </div>
                                    <p className="text-xs">
                                      {reply.content || "No content"}
                                    </p>
                                    <div className="flex gap-2 items-center mt-1">
                                      {canDeleteReply && (
                                        <button
                                          onClick={() =>
                                            handleDeleteReply(
                                              comment._id,
                                              reply._id
                                            )
                                          }
                                          className="btn btn-ghost btn-xs text-error hover:text-error-focus">
                                          <Trash2 size={12} />
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          handleLikeReply(
                                            comment._id,
                                            reply._id
                                          )
                                        }
                                        className={`btn btn-ghost btn-xs flex items-center gap-1 ${
                                          isReplyLiked
                                            ? "text-error"
                                            : "text-base-content/60 hover:text-error"
                                        }`}>
                                        <Heart
                                          size={12}
                                          fill={
                                            isReplyLiked
                                              ? "currentColor"
                                              : "none"
                                          }
                                        />
                                        {Array.isArray(reply.likes)
                                          ? reply.likes.length
                                          : 0}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-base-content/60">No comments yet.</p>
            )}
          </div>

          {/* Actions & Comment Input */}
          <div className="p-4 border-t border-base-300">
            <div className="flex items-center gap-3 mb-3">
              <button
                className={`btn btn-ghost btn-sm ${
                  isLiked
                    ? "text-error"
                    : "text-base-content/60 hover:text-error"
                }`}
                onClick={handleToggleLike}>
                <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
              </button>
              <button
                className="btn btn-ghost btn-sm text-base-content/60 hover:text-base-content"
                onClick={handleShare}>
                <IoIosShareAlt size={24} />
              </button>
              <button
                className={`btn btn-ghost btn-sm ${
                  bookmarked
                    ? "text-base-content"
                    : "text-base-content/60 hover:text-base-content"
                }`}
                onClick={handleToggleSave}>
                <BookmarkPlus
                  size={24}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>
            </div>
            <form
              onSubmit={handleAddComment}
              className="flex items-center gap-2">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="textarea textarea-bordered w-full text-sm"
                rows={1}
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Post
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;
