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

const PostCard = ({
  images = [],
  userId,
  userImage,
  userName,
  time,
  content,
  postId,
  onEdit, // ✅ Prop for editing, expected to be a function from parent
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const user = useUser();
  const { deletePost } = usePostStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  // console.log("Current User:", user);
  // console.log("Post User ID:", userId);
  // console.log("Post ID:", postId);
  // console.log("onEdit Prop:", onEdit); // ✅ Debug to check if onEdit is passed

  const words = (content || "").split(" ");
  const shortContent = words.slice(0, 20).join(" ");

  const isPostCreator =
    userId && user?._id ? user._id.toString() === userId.toString() : false;

  const handleDelete = async () => {
    if (!postId) {
      // console.error("Cannot delete: postId is undefined");
      alert("Cannot delete post: Invalid post ID");
      return;
    }
    try {
      await deletePost(postId);
      setMenuOpen(false);
    } catch (error) {
      // console.error("Delete error:", error);
      alert("Failed to delete post");
    }
  };

  const handleEdit = () => {
    if (!postId) {
      // console.error("Cannot edit: postId is undefined");
      alert("Cannot edit post: Invalid post ID");
      return;
    }
    if (!onEdit || typeof onEdit !== "function") {
      // console.error("onEdit is not a function or not provided");
      alert("Edit functionality is not available");
      return;
    }
    const postData = {
      _id: postId,
      caption: content,
      postImage: images,
      user: userId,
    };
    onEdit(postData); // Call parent's onEdit function
    setMenuOpen(false);
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
    <div className="w-full sm:w-[420px] md:w-[450px] lg:w-[480px] xl:w-[500px] mx-auto p-3 rounded-lg border border-base-300 shadow-md transition-all duration-300 hover:shadow-lg relative">
      {isLoading ? (
        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 shrink-0 rounded-full bg-base-300"></div>
            <div className="flex flex-col gap-2">
              <div className="skeleton h-4 w-24 bg-base-300"></div>
              <div className="skeleton h-3 w-32 bg-base-300"></div>
            </div>
          </div>
          <div className="skeleton h-48 w-full bg-base-300 rounded-lg"></div>
          <div className="skeleton h-4 w-3/4 bg-base-300"></div>
          <div className="skeleton h-4 w-2/3 bg-base-300"></div>
          <div className="flex gap-4 mt-2">
            <div className="skeleton h-6 w-16 bg-base-300"></div>
            <div className="skeleton h-6 w-20 bg-base-300"></div>
            <div className="skeleton h-6 w-20 bg-base-300"></div>
          </div>
        </div>
      ) : (
        <>
          {images.length > 1 ? (
            <EmblaCarousel images={images} />
          ) : (
            <img
              alt="Post"
              className="w-full h-48 sm:h-56 md:h-60 object-cover rounded-lg mb-4"
              src={images[0]?.url || "fallback.jpg"}
            />
          )}

          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <img
                alt="User"
                className="w-10 h-10 rounded-full mr-3"
                src={userImage}
              />
              <div className="flex flex-col">
                <h2 className="text-md sm:text-lg font-bold text-base-content">
                  {userName}
                </h2>
                <p className="text-base-content/60 text-sm">{time}</p>
              </div>
            </div>
            <FollowButton userId={user._id} />
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

          <div className="px-3 flex items-center justify-between mt-auto">
            <div className="flex gap-3">
              <button
                className={`flex items-center transition-all duration-300 focus:outline-none focus-visible:outline-none ${
                  liked
                    ? "text-error scale-110"
                    : "text-base-content/80 hover:scale-110"
                }`}
                onClick={() => setLiked(!liked)}>
                <Heart
                  size={22}
                  fill={liked ? "currentColor" : "none"}
                  className="mr-1 sm:mr-2 transition-all duration-300"
                />
              </button>
              <button className="flex items-center text-base-content/80 transition-all duration-300 hover:scale-110">
                <MessageCirclePlus size={22} className="mr-1 sm:mr-2" />
              </button>
              <button className="flex items-center text-base-content/80 transition-all duration-300 hover:scale-110">
                <IoIosShareAlt size={22} className="mr-1 sm:mr-2" />
              </button>
            </div>
            <div>
              <button
                className={`flex items-center transition-all duration-300 ${
                  bookmarked
                    ? "text-base-content scale-110"
                    : "text-base-content/80 hover:scale-110 hover:text-base-content"
                }`}
                onClick={() => setBookmarked(!bookmarked)}>
                <BookmarkPlus
                  size={22}
                  fill={bookmarked ? "currentColor" : "none"}
                  className="mr-1 sm:mr-2 transition-all duration-300"
                />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PostCard;
