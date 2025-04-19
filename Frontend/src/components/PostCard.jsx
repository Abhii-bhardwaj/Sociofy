import React, { useState, useEffect } from "react";
import {
  Heart,
  MessageCirclePlus,
  BookmarkPlus,
  MoreHorizontal,
} from "lucide-react";
import { IoIosShareAlt } from "react-icons/io";
import FollowButton from "./FollowButton";
import useUser from "../hooks/useUser.hook";
import EmblaCarousel from "./EmblaCarousel";
import { usePostStore } from "../store/usePostStore";
import { useSocket } from "../hooks/useSocket.hook";
import CommentModal from "../modal/CommentModal";
import ShareModal from "../modal/ShareModal";
import toast from "react-hot-toast";

const PostCard = ({
  images = [],
  userId,
  userImage,
  userName,
  time,
  content,
  postId,
  onEdit,
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const user = useUser();
  const { posts, deletePost, Like, Save, sharePost } = usePostStore();
  const { socket } = useSocket();

  const currentPost = {
    _id: postId,
    likes: Array.isArray(posts.find((post) => post._id === postId)?.likes)
      ? posts.find((post) => post._id === postId)?.likes
      : [],
    comments: Array.isArray(posts.find((post) => post._id === postId)?.comments)
      ? posts.find((post) => post._id === postId)?.comments
      : [],
    shares: Array.isArray(posts.find((post) => post._id === postId)?.shares)
      ? posts.find((post) => post._id === postId)?.shares
      : [],
    user: {
      _id: userId,
      profilePic: userImage || "default-user.jpg",
      username: userName || "Unknown",
    },
    caption: content || "",
    postImage: Array.isArray(images) ? images : [],
    createdAt: time || new Date().toISOString(),
  };

  const { likes, comments, shares } = currentPost;
  const isLiked =
    user?._id && Array.isArray(likes)
      ? likes.some(
          (like) =>
            like?.userId && like.userId.toString() === user._id.toString()
        )
      : false;
  const [bookmarked, setBookmarked] = useState(false);

  // useEffect(() => {
  //   console.log("PostCard rendered for postId:", postId, "Data:", {
  //     likes,
  //     isLiked,
  //     userId: user?._id,
  //     comments: comments.length,
  //     shares: shares.length,
  //   });
  // }, [postId, likes, isLiked, comments, shares, user]);

  const words = (content || "").split(" ");
  const shortContent = words.slice(0, 20).join(" ");

  const isPostCreator =
    userId && user?._id ? user._id.toString() === userId.toString() : false;

  const handleDelete = async () => {
    if (!postId) return toast.error("Cannot delete post: Invalid post ID");
    try {
      await deletePost(postId);
      setMenuOpen(false);
      toast.success("Post deleted successfully");
      // console.log(`Deleted post ${postId}`);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  };

  const handleEdit = () => {
    if (!postId || !onEdit || typeof onEdit !== "function")
      return toast.error("Edit functionality is not available");
    const postData = {
      _id: postId,
      caption: content,
      postImage: images,
      user: userId,
    };
    onEdit(postData);
    setMenuOpen(false);
  };

  const handleToggleLike = async () => {
    if (!user?._id) return toast.error("Please login to like this post");
    if (!Like) return toast.error("Like functionality is not available");
    try {
      await Like(postId);
      // console.log(
      //   `Toggled like for post ${postId}, expected isLiked: ${!isLiked}`
      // );
      if (socket && user._id !== userId) {
        socket.emit("like_post", {
          postId,
          userId,
          likerId: user._id,
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
      toast.error("Failed to like post");
    }
  };

  const handleToggleSave = async () => {
    if (!user?._id) return toast.error("Please login to save this post");
    if (!Save) return toast.error("Save functionality is not available");
    try {
      const saved = await Save(postId);
      setBookmarked(saved);
      toast.success(`Post ${saved ? "saved" : "unsaved"}`);
      // console.log(`Post ${postId} ${saved ? "saved" : "unsaved"}`);
    } catch (error) {
      console.error("Error saving post:", error);
      toast.error("Failed to save post");
    }
  };

  const handleShare = async () => {
    if (!user?._id) return toast.error("Please login to share this post");
    if (!sharePost) return toast.error("Share functionality is not available");
    try {
      const response = await sharePost(postId);
      if (response && response.shareUrl) {
        setShareUrl(response.shareUrl);
        setIsShareModalOpen(true);
        if (socket && user._id !== userId) {
          socket.emit("share_post", {
            postId,
            userId,
            sharerId: user._id,
          });
        }
      } else {
        console.error("No shareUrl received from sharePost");
        toast.error("Failed to generate share URL");
      }
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error("Failed to share post");
    }
  };

  const handleOpenCommentModal = () => {
    setIsCommentModalOpen(true);
  };

  const handleAddComment = async (content) => {
    if (!user?._id) return toast.error("Please login to comment");
    try {
      await usePostStore.getState().addComment(postId, content);
      if (socket && user._id !== userId) {
        socket.emit("comment_post", {
          postId,
          userId,
          commenterId: user._id,
          content,
        });
      }
      toast.success("Comment added successfully");
      // console.log(`Added comment to post ${postId}: ${content}`);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    }
  };

  const creatorOptions = [
    { label: "Delete Post", action: handleDelete },
    { label: "Edit Post", action: handleEdit },
  ];

  const otherUserOptions = [
    {
      label: "Not Interested",
      action: () => console.log("Not Interested clicked"),
    },
    { label: "Report This Post", action: () => console.log("Report clicked") },
    { label: "Hide Post", action: () => console.log("Hide clicked") },
  ];

  const menuOptions = user
    ? isPostCreator
      ? creatorOptions
      : otherUserOptions
    : [];

  return (
    <div className="w-full max-w-lg mx-auto p-4 rounded-lg border border-base-300 shadow-md transition-all duration-300 hover:shadow-lg">
      {/* Content Wrapper */}
      <div className="w-full max-w-[400px] mx-auto">
        {/* Image Section */}
        <div className="relative w-full max-h-[500px] overflow-hidden rounded-lg mb-4">
          {images.length > 1 ? (
            <EmblaCarousel images={images} />
          ) : (
            <img
              alt="Post"
              className="w-full h-auto object-contain rounded-lg"
              src={images[0]?.url || "fallback.jpg"}
              loading="lazy"
            />
          )}
        </div>

        {/* User Info Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <img
                alt="User"
                className="w-10 h-10 rounded-full object-cover mr-3"
                src={currentPost.user.profilePic}
              />
              <div className="flex flex-col">
                <h2 className="text-md font-bold text-base-content">
                  {currentPost.user.username}
                </h2>
                <p className="text-base-content/60 text-sm">{time}</p>
              </div>
            </div>
            {!isPostCreator && <FollowButton userId={userId} />}
          </div>
          {user && (
            <div className="relative">
              <button
                className="text-base-content/80 hover:text-base-content transition-all duration-300 focus:outline-none"
                onClick={() => setMenuOpen(!menuOpen)}>
                <MoreHorizontal size={22} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-base-200 border border-base-300 rounded-lg shadow-lg z-10">
                  {menuOptions.map((option, index) => (
                    <button
                      key={index}
                      className="block w-full text-left px-4 py-2 text-sm text-base-content/80 hover:bg-base-300 hover:text-base-content transition-all duration-200"
                      onClick={() => {
                        option.action();
                        setMenuOpen(false);
                      }}>
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Caption Section */}
        <p className="text-base-content/80 text-sm mb-4">
          {showFullContent
            ? content
            : words.length > 20
            ? `${shortContent}... `
            : content}
          {words.length > 20 && !showFullContent && (
            <button
              className="text-primary ml-1 hover:underline"
              onClick={() => setShowFullContent(true)}>
              Read more
            </button>
          )}
        </p>

        {/* Actions Section */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              className={`flex items-center transition-all duration-300 focus:outline-none ${
                isLiked
                  ? "text-error"
                  : "text-base-content/80 hover:text-base-content"
              }`}
              onClick={handleToggleLike}>
              <Heart
                size={22}
                fill={isLiked ? "#ff0000" : "none"}
                stroke={isLiked ? "#ff0000" : "currentColor"}
                className="mr-1 sm:mr-2 transition-all duration-300"
              />
              <span>{Array.isArray(likes) ? likes.length : 0}</span>
            </button>
            <button
              className="flex items-center text-base-content/80 transition-all duration-300 hover:text-base-content"
              onClick={handleOpenCommentModal}>
              <MessageCirclePlus size={22} className="mr-1 sm:mr-2" />
              <span>{Array.isArray(comments) ? comments.length : 0}</span>
            </button>
            <button
              className="flex items-center text-base-content/80 transition-all duration-300 hover:text-base-content"
              onClick={handleShare}>
              <IoIosShareAlt size={22} className="mr-1 sm:mr-2" />
              <span>{Array.isArray(shares) ? shares.length : 0}</span>
            </button>
          </div>
          <div>
            <button
              className={`flex items-center transition-all duration-300 ${
                bookmarked
                  ? "text-base-content"
                  : "text-base-content/80 hover:text-base-content"
              }`}
              onClick={handleToggleSave}>
              <BookmarkPlus
                size={22}
                fill={bookmarked ? "currentColor" : "none"}
                className="mr-1 sm:mr-2 transition-all duration-300"
              />
            </button>
          </div>
        </div>
      </div>

      {isCommentModalOpen && (
        <CommentModal
          postId={postId}
          userId={userId}
          images={images}
          profilePic={currentPost.user.profilePic}
          userName={currentPost.user.username}
          content={content}
          likes={likes}
          comments={comments}
          shares={shares}
          onClose={() => setIsCommentModalOpen(false)}
          onComment={handleAddComment}
        />
      )}
      {isShareModalOpen && (
        <ShareModal
          postId={postId}
          shareUrl={shareUrl}
          onClose={() => setIsShareModalOpen(false)}
        />
      )}
    </div>
  );
};

export default PostCard;
