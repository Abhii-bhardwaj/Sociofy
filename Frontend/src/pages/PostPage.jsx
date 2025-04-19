import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import PostCard from "../components/PostCard";
import TopBar from "../components/TopBar";
import Sidebar from "../components/Sidebar";
import StatusBar from "../components/StatusBar";
import toast from "react-hot-toast";

const PostPage = () => {
  const { postId, shortCode } = useParams();
  const { authUser } = useAuthStore();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const url = shortCode ? `/post/s/${shortCode}` : `/post/${postId}`;
        const { data } = await axiosInstance.get(url);

        if (!data.post) {
          throw new Error("Post not found in response");
        }

        setPost(data.post);
        setLoading(false);
        console.log("Post fetched successfully:", data.post);
      } catch (error) {
        console.error("Error fetching post:", error.message);
        toast.error(error.response?.data?.message || "Failed to load post");
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, shortCode]);

  // Redirect handler for non-authenticated users
  const handleInteraction = (e) => {
    if (!authUser) {
      e.preventDefault();
      toast("Please log in to interact!", { icon: "🔒" });
      navigate("/login");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex justify-center items-center">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/80">Loading post...</p>
        </div>
      </div>
    );
  }

  // Post not found state
  if (!post) {
    return (
      <div className="min-h-screen bg-base-100 flex justify-center items-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-base-content/80">
            Post Not Found
          </h2>
          <p className="mt-2 text-base-content/60">
            The post you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* TopBar - Always visible, interaction redirected for non-auth */}
      <div onClick={!authUser ? handleInteraction : undefined}>
        <TopBar />
      </div>

      <div className="flex flex-1">
        {/* Sidebar - Visible on md+ screens, interaction redirected for non-auth */}
        <div
          className="hidden md:block w-64 flex-shrink-0"
          onClick={!authUser ? handleInteraction : undefined}>
          <Sidebar />
        </div>

        {/* Main Content - PostCard */}
        <div className="flex-1 flex justify-center p-4">
          <PostCard
            userId={post.user._id}
            postId={post._id}
            images={post.postImage || []}
            userImage={post.user.profilePic || "default-user-image.jpg"}
            userName={post.user.username || "Unknown"}
            time={new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            content={post.caption}
          />
        </div>
      </div>

      {/* StatusBar - Visible on mobile, interaction redirected for non-auth */}
      <div
        className="md:hidden"
        onClick={!authUser ? handleInteraction : undefined}>
        <StatusBar />
      </div>
    </div>
  );
};

export default PostPage;
