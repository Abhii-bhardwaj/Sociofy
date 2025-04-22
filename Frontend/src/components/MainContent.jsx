// components/MainContent.jsx
import React, { useState, useEffect, useCallback } from "react";
import PostCard from "./PostCard";
import FollowButton from "./FollowButton";
import CreatePost from "../modal/CreatePost";
import useSidebarStore from "../store/useSidebarStore";
import { usePostStore } from "../store/usePostStore";
import { useFollowStore } from "../store/useFollowStore"; // Import follow store
import {axiosInstance} from "../lib/axios";
import toast from "react-hot-toast";

const MainContent = () => {
  const { isSidebarOpen } = useSidebarStore();
  const { posts, fetchPosts } = usePostStore();
  const { following } = useFollowStore(); // Get following list from store
  const [editPost, setEditPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);

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

  const fetchSuggestions = useCallback(async () => {
    setSuggestionsLoading(true);
    try {
      const { data } = await axiosInstance.get("/user/suggestions");

      // Filter out users that are already being followed (double check with frontend state)
      const followingIds = following.map((user) => user._id);
      const filteredSuggestions = data.filter(
        (user) => !followingIds.includes(user._id)
      );

      setSuggestions(filteredSuggestions || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Failed to load suggestions");
    } finally {
      setSuggestionsLoading(false);
    }
  }, [following]); // Add following as dependency

  // Re-fetch suggestions when following list changes
  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions, following]);

  const handleEditPost = (postData) => {
    setEditPost(postData);
  };

  const handleRetry = () => {
    loadPosts();
  };

  const handleRefreshSuggestions = () => {
    fetchSuggestions();
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

  const SuggestionSkeletonLoader = () => (
    <div className="space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-2">
          <div className="skeleton h-12 w-12 rounded-full bg-base-300"></div>
          <div className="flex flex-col gap-1 flex-1">
            <div className="skeleton h-4 w-24 bg-base-300"></div>
            <div className="skeleton h-3 w-32 bg-base-300"></div>
          </div>
          <div className="skeleton h-8 w-16 bg-base-300 rounded-full"></div>
        </div>
      ))}
    </div>
  );

  // Filter out suggestions in real-time when following changes
  const filteredSuggestions = suggestions.filter(
    (suggestion) => !following.some((user) => user._id === suggestion._id)
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">People You May Know</h2>
            <button
              onClick={handleRefreshSuggestions}
              className="btn btn-ghost btn-sm"
              disabled={suggestionsLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                className="bi bi-arrow-clockwise"
                viewBox="0 0 16 16">
                <path
                  fillRule="evenodd"
                  d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"
                />
                <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
              </svg>
            </button>
          </div>

          {suggestionsLoading ? (
            <SuggestionSkeletonLoader />
          ) : filteredSuggestions.length > 0 ? (
            <div className="space-y-4">
              {filteredSuggestions.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center gap-3 p-2 hover:bg-base-200 rounded-lg transition-colors">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded-full">
                      <img
                        src={user.profilePic || "/default-user-image.jpg"}
                        alt={user.username}
                        className="object-cover"
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="font-medium">
                      {user.username || "Unknown User"}
                    </h3>
                    <p className="text-sm text-base-content/70">
                      {user.fullName || ""}
                    </p>
                  </div>

                  <FollowButton userId={user._id} initialFollowing={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center p-4">
              <p className="text-base-content/60">No suggestions available</p>
              <button
                onClick={handleRefreshSuggestions}
                className="btn btn-ghost btn-sm text-primary mt-2">
                Refresh
              </button>
            </div>
          )}

          {filteredSuggestions.length > 0 && (
            <div className="mt-6 text-center">
              <button className="btn btn-ghost btn-sm text-primary">
                See More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainContent;
