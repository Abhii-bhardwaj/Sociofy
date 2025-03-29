import { create } from "zustand";
import { axiosInstance } from "../lib/axios";

export const usePostStore = create((set) => ({
  posts: [],
  fetchPosts: async () => {
    try {
      const { data } = await axiosInstance.get("/post/fetch-post");
      console.log("Fetched posts:", data); // Debug
      set({ posts: data.posts || [] }); // Fallback to empty array
    } catch (error) {
      console.error("Error fetching posts:", error);
      set({ posts: [] });
    }
  },
  addPost: (newPost) =>
    set((state) => {
      console.log("Adding new post:", newPost);
      return { posts: [newPost, ...state.posts] };
    }),
  deletePost: async (postId) => {
    try {
      await axiosInstance.delete(`/post/delete/${postId}`); // API call
      set((state) => ({
        posts: state.posts.filter((post) => post._id !== postId), // Remove post from state
      }));
      console.log(`Post ${postId} deleted successfully`);
    } catch (error) {
      console.error("Error deleting post:", error);
      throw error; // Re-throw error to handle in component
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
      console.log("API Response - Updated Post:", data.post);
      set((state) => {
      const newPosts = state.posts.map((post) =>
        post._id === postId ? data.post : post
      );
        console.log("New state after edit:", newPosts);
      return { posts: newPosts };
      });
      console.log(`Post ${postId} updated successfully`);
    } catch (error) {
      console.error("Error editing post:", error);
      throw error;
    }
  },
}));
