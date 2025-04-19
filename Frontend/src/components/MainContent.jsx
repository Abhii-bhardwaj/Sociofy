// components/MainContent.jsx
import React, { useState, useEffect, useCallback } from "react";
import PostCard from "./PostCard";
import SidePost from "./SidePost";
import CreatePost from "../modal/CreatePost";
import useSidebarStore from "../store/useSidebarStore";
import { usePostStore } from "../store/usePostStore";

const MainContent = () => {
  const { isSidebarOpen } = useSidebarStore();
  const { posts, fetchPosts } = usePostStore();
  const [editPost, setEditPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      console.log("Starting loadPosts...");
      const fetchedPosts = await fetchPosts();
      if (!fetchedPosts || fetchedPosts.length === 0) {
        console.warn("No posts returned from fetchPosts");
      }
    } catch (err) {
      console.error("loadPosts error:", err.message);
      setError("Failed to load posts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    if (posts.length > 0 && isLoading) {
      setIsLoading(false);
    }
  }, [posts, isLoading]);

  const handleEditPost = (postData) => {
    setEditPost(postData);
  };

  const handleRetry = () => {
    loadPosts();
  };

  const SkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="w-full max-w-lg mx-auto p-4 rounded-lg border border-base-300 shadow-md">
          <div className="flex items-center gap-4">
            <div className="skeleton h-12 w-12 shrink-0 rounded-full bg-base-300"></div>
            <div className="flex flex-col gap-2 w-full">
              <div className="skeleton h-4 w-24 bg-base-300"></div>
              <div className="skeleton h-3 w-32 bg-base-300"></div>
            </div>
          </div>
          <div className="skeleton h-48 w-full bg-base-300 rounded-lg mt-4"></div>
          <div className="skeleton h-4 w-3/4 bg-base-300 mt-2"></div>
          <div className="skeleton h-4 w-2/3 bg-base-300 mt-1"></div>
          <div className="flex gap-4 mt-2">
            <div className="skeleton h-6 w-16 bg-base-300"></div>
            <div className="skeleton h-6 w-20 bg-base-300"></div>
            <div className="skeleton h-6 w-20 bg-base-300"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div
      className={`flex flex-col lg:flex-row min-h-screen bg-base-100 overflow-y-auto px-2 md:px-8 transition-all duration-300 ${
        isSidebarOpen ? "md:ml-64" : "md:ml-0"
      }`}>
      <CreatePost
        isOpen={!!editPost}
        onClose={() => setEditPost(null)}
        postToEdit={editPost}
      />
      <div
        className={`w-full lg:w-3/5 p-4 overflow-y-auto min-h-screen transition-all duration-300 ${
          isSidebarOpen ? "md:w-2/3" : "md:w-full"
        }`}>
        <div className="space-y-4 mb-2">
          {isLoading ? (
            <SkeletonLoader />
          ) : error ? (
            <div className="text-center">
              <p className="text-error mb-4">{error}</p>
              <button onClick={handleRetry} className="btn btn-primary btn-sm">
                Retry
              </button>
            </div>
          ) : posts.length > 0 ? (
            posts.map((post, index) => {
              return (
                <div
                  key={post._id || index}
                  className={index === posts.length - 1 ? "mb-32" : ""}>
                  <PostCard
                    userId={post.user?._id || ""}
                    postId={post._id || ""}
                    images={post.postImage || []}
                    userImage={
                      post.user?.profilePic || "default-user-image.jpg"
                    }
                    userName={post.user?.username || "Unknown"}
                    time={
                      post.createdAt
                        ? new Date(post.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "Unknown Date"
                    }
                    content={post.caption || ""}
                    onEdit={handleEditPost}
                  />
                </div>
              );
            })
          ) : (
            <div className="text-center">
              <p className="text-base-content/60 mb-4">
                No posts found. Create one to get started!
              </p>
              <button onClick={handleRetry} className="btn btn-primary btn-sm">
                Retry
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="hidden lg:block lg:w-2/5 p-4 overflow-y-auto min-h-screen bg-base-100 m-auto border-l-4 border-base-300">
        <div className="space-y-4">
          <SidePost
            image="https://storage.googleapis.com/a1aa/image/55gR71C6xAAb4OBtMyDPDmumdrADOgzgIz-r8R17hAg.jpg"
            title="Side Post Title"
            content="This is a side post content."
          />
        </div>
      </div>
    </div>
  );
};

export default MainContent;
