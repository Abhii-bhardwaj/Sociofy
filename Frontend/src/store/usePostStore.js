// store/usePostStore.js
import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import emitter from "../lib/eventEmitter";

// Deduplication promise
let fetchPostsPromise = null;

export const usePostStore = create((set, get) => ({
  posts: [],
  fetchPosts: async () => {
    if (fetchPostsPromise) {
      // console.log(
      //   "fetchPosts already in progress, awaiting existing promise..."
      // );
      return fetchPostsPromise;
    }
    fetchPostsPromise = (async () => {
      try {
        // console.log("Starting fetchPosts...");
        const response = await axiosInstance.get("/post/fetch-post");
        // console.log("fetchPosts response:", response);
        const { data } = response;
        // console.log("fetchPosts data:", data);
        let postsArray = [];
        if (Array.isArray(data.posts)) {
          postsArray = data.posts;
        } else if (data.posts?.posts && Array.isArray(data.posts.posts)) {
          postsArray = data.posts.posts;
        }
        // console.log("Posts array extracted:", postsArray);
        if (postsArray.length === 0) {
          console.warn("No posts found in response");
        }
        set({ posts: postsArray });
        // console.log("Posts set in store:", postsArray);
        return postsArray;
      } catch (error) {
        console.error("fetchPosts error:", error.message, error.stack);
        toast.error("Failed to fetch posts");
        throw error;
      } finally {
        fetchPostsPromise = null;
        // console.log("fetchPosts completed");
      }
    })();
    return fetchPostsPromise;
  },
  fetchSavedPosts: async () => {
    try {
      const response = await axiosInstance.get("/user/saved-posts", {
        withCredentials: true,
      });
      console.log("Fetched saved posts:", response.data.posts); // Debug
      set({ posts: response.data.posts });
    } catch (error) {
      console.error("Error fetching saved posts:", error);
      toast.error("Failed to fetch saved posts");
    }
  },

  addPost: (newPost) =>
    set((state) => {
      // console.log("Adding new post:", newPost);
      return { posts: [newPost, ...state.posts] };
    }),

  deletePost: async (postId) => {
    try {
      await axiosInstance.delete(`/post/delete/${postId}`);
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId),
      }));
      console.log(`Post ${postId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post");
    }
  },

  editPost: async (postId, updatedPostData) => {
    if (!postId) throw new Error("Post ID is required");
    try {
      const { data } = await axiosInstance.put(
        `/post/${postId}`,
        updatedPostData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId ? data.post : post
        ),
      }));
      // console.log(`Post ${postId} updated successfully`);
    } catch (error) {
      console.error("Error editing post:", error);
      toast.error("Failed to edit post");
    }
  },

  updatePost: (postId, updatedData) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post._id === postId ? { ...post, ...updatedData } : post
      ),
    }));
    // console.log(`Post ${postId} updated via socket`);
  },

  Like: async (postId) => {
    try {
      const { data } = await axiosInstance.post(`/post/${postId}/like`);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                likes: data.liked
                  ? [...post.likes, { likedAt: new Date() }]
                  : post.likes.slice(0, -1),
              }
            : post
        ),
      }));
      console.log(`Post ${postId} ${data.liked ? "liked" : "unliked"}`);
      toast.success(`Post ${data.liked ? "liked" : "unliked"}`);
    } catch (error) {
      console.error("Error toggling like:", error);
      toast.error(error.message || "Failed to toggle like");
    }
  },

  Save: async (postId) => {
    try {
      const { data } = await axiosInstance.post(`/post/${postId}/save`);
      // console.log(`Post ${postId} ${data.saved ? "saved" : "unsaved"}`);
      toast.success(`Post ${data.saved ? "saved" : "unsaved"}`);
      return data.saved;
    } catch (error) {
      console.error("Error toggling save:", error);
      toast.error(error.response?.data?.message || "Failed to toggle save");
      throw error;
    }
  },

  addComment: async (postId, content) => {
    try {
      const { data } = await axiosInstance.post(`/post/${postId}/comment`, {
        content,
      });
      // console.log(`Adding comment to post ${postId}:`, data.comment);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.some((c) => c._id === data.comment._id)
                  ? post.comments
                  : [...post.comments, data.comment],
              }
            : post
        ),
      }));
      // console.log(`Comment added to post ${postId}`);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error(error.response?.data?.message || "Failed to add comment");
    }
  },

  addReply: async (postId, commentId, content) => {
    try {
      const { data } = await axiosInstance.post(
        `/post/${postId}/comment/${commentId}/reply`,
        { content }
      );
      // console.log(`Adding reply to comment ${commentId}:`, data.comment);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment._id === commentId
                    ? {
                        ...comment,
                        replies: data.comment.replies || [],
                      }
                    : comment
                ),
              }
            : post
        ),
      }));
      // console.log(`Reply added to comment ${commentId}`);
    } catch (error) {
      console.error("Error adding reply:", error);
      toast.error(error.response?.data?.message || "Failed to add reply");
    }
  },

  deleteComment: async (postId, commentId) => {
    try {
      await axiosInstance.delete(`/post/${postId}/comment/${commentId}`);
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.filter(
                  (comment) => comment._id !== commentId
                ),
              }
            : post
        ),
      }));
      // console.log(`Comment ${commentId} deleted`);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error(error.response?.data?.message || "Failed to delete comment");
    }
  },

  likeComment: async (postId, commentId) => {
    try {
      const { data } = await axiosInstance.post(
        `/post/${postId}/comment/${commentId}/like`
      );
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment._id === commentId
                    ? {
                        ...comment,
                        likes: Array.isArray(data.comment?.likes)
                          ? data.comment.likes.filter((like) => like != null)
                          : [],
                      }
                    : comment
                ),
              }
            : post
        ),
      }));
      // console.log(`Comment ${commentId} ${data.liked ? "liked" : "unliked"}`);
    } catch (error) {
      console.error("Error liking comment:", error);
      toast.error(error.response?.data?.message || "Failed to like comment");
      throw error;
    }
  },

  likeReply: async (postId, commentId, replyId) => {
    try {
      const { data } = await axiosInstance.post(
        `/post/${postId}/comment/${commentId}/reply/${replyId}/like`
      );
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment._id === commentId
                    ? {
                        ...comment,
                        replies: comment.replies.map((reply) =>
                          reply._id === replyId
                            ? {
                                ...reply,
                                likes: Array.isArray(data.likes)
                                  ? data.likes.filter((like) => like != null)
                                  : [],
                              }
                            : reply
                        ),
                      }
                    : comment
                ),
              }
            : post
        ),
      }));
      // console.log(`Reply ${replyId} ${data.liked ? "liked" : "unliked"}`);
    } catch (error) {
      console.error("Error liking reply:", error);
      toast.error(error.response?.data?.message || "Failed to like reply");
    }
  },

  deleteReply: async (postId, commentId, replyId) => {
    try {
      await axiosInstance.delete(
        `/post/${postId}/comment/${commentId}/reply/${replyId}`
      );
      set((state) => ({
        posts: state.posts.map((post) =>
          post._id === postId
            ? {
                ...post,
                comments: post.comments.map((comment) =>
                  comment._id === commentId
                    ? {
                        ...comment,
                        replies: comment.replies.filter(
                          (reply) => reply._id !== replyId
                        ),
                      }
                    : comment
                ),
              }
            : post
        ),
      }));
      // console.log(`Reply ${replyId} deleted`);
    } catch (error) {
      console.error("Error deleting reply:", error);
      toast.error(error.response?.data?.message || "Failed to delete reply");
    }
  },

  sharePost: async (postId) => {
    try {
      const { data } = await axiosInstance.post(`/post/${postId}/share`);
      console.log(`Post ${postId} shared`);
      return data;
    } catch (error) {
      console.error("Error sharing post:", error);
      toast.error(error.response?.data?.message || "Failed to share post");
    }
  },

  syncUserData: (user) => {
    if (user) {
      console.log("Syncing user data, triggering fetchPosts...");
      get().fetchPosts();
    }
  },

  initializeSocket: (socket) => {
    const debounce = (fn, delay) => {
      let timeout;
      return (...args) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
    };

    socket.on(
      "postUpdated",
      debounce((data) => {
        console.log("Received postUpdated:", data);
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === data._id
              ? {
                  ...post,
                  likes: Array.isArray(data.likes) ? data.likes : post.likes,
                  comments: data.comments || post.comments,
                  shares: data.shares || post.shares,
                }
              : post
          ),
        }));
      }, 500)
    );

    socket.on(
      "commentAdded",
      debounce((data) => {
        console.log("Received commentAdded:", data);
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === data.postId
              ? {
                  ...post,
                  comments: post.comments.some(
                    (c) => c._id === data.comment._id
                  )
                    ? post.comments
                    : [...post.comments, data.comment],
                }
              : post
          ),
        }));
      }, 500)
    );

    socket.on(
      "commentUpdated",
      debounce((data) => {
        console.log("Received commentUpdated:", data);
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === data.postId
              ? {
                  ...post,
                  comments: post.comments.map((comment) =>
                    comment._id === data.comment._id
                      ? {
                          ...data.comment,
                          likes: Array.isArray(data.comment.likes)
                            ? data.comment.likes.filter((like) => like != null)
                            : comment.likes || [],
                          replies: data.comment.replies || comment.replies,
                        }
                      : comment
                  ),
                }
              : post
          ),
        }));
      }, 500)
    );

    socket.on(
      "commentDeleted",
      debounce((data) => {
        console.log("Received commentDeleted:", data);
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === data.postId
              ? {
                  ...post,
                  comments: post.comments.filter(
                    (comment) => comment._id !== data.commentId
                  ),
                }
              : post
          ),
        }));
      }, 500)
    );

    socket.on(
      "postShared",
      debounce((data) => {
        console.log("Received postShared:", data);
        set((state) => ({
          posts: state.posts.map((post) =>
            post._id === data._id
              ? { ...post, shares: data.shares || post.shares }
              : post
          ),
        }));
      }, 500)
    );
  },
}));

export const useSyncPosts = () => {
  useEffect(() => {
    let timeout;
    const handler = (user) => {
      if (!user) {
        console.log("No user in USER_UPDATED, skipping sync");
        return;
      }
      if (timeout) {
        console.log("Throttling syncUserData call");
        return;
      }
      console.log("USER_UPDATED event received, user:", user);
      timeout = setTimeout(() => {
        if (usePostStore.getState().posts.length === 0) {
          usePostStore.getState().syncUserData(user);
        } else {
          console.log("Posts already loaded, skipping syncUserData");
        }
        timeout = null;
      }, 1000);
    };
    emitter.on("USER_UPDATED", handler);
    return () => {
      console.log("Cleaning up USER_UPDATED listener");
      emitter.off("USER_UPDATED", handler);
      if (timeout) clearTimeout(timeout);
    };
  }, []);
};
