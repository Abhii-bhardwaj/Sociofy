import { create } from "zustand";
import { useEffect } from "react";
import toast from "react-hot-toast";
import emitter from "../lib/eventEmitter";
import { axiosInstance } from "../lib/axios"; // Use your axios instance

export const useProfileStore = create((set) => ({
  profileUser: null,
  loading: true,
  error: null,

  fetchProfileUser: async (username, authUser) => {
    set({ loading: true, error: null });
    try {
      console.log("Fetching profile for username:", username);
      console.log("Logged-in authUser:", authUser);

      // Fetch profile data
      const { data: profileData } = await axiosInstance.get(
        `/user/profile/${username}`,
        { withCredentials: true }
      );
      console.log("Fetched user data from API:", profileData);

      // Fetch user's posts by username
      const { data: postsData } = await axiosInstance.get(
        `/user/${username}/posts`,
        { withCredentials: true }
      );
      console.log("Fetched posts for user:", postsData);

      set({
        profileUser: {
          ...profileData,
          posts: postsData.posts, // Add posts to profileUser
          totalPosts: postsData.totalPosts,
        },
      });

      emitter.emit("PROFILE_UPDATED", {
        ...profileData,
        posts: postsData.posts,
      });
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to load profile";
      console.error(
        "Error fetching profile or posts:",
        error.response?.data || error.message
      );
      set({ error: errorMsg, profileUser: null });
      toast.error(errorMsg);
      emitter.emit("PROFILE_ERROR", errorMsg);
    } finally {
      set({ loading: false });
    }
  },

  clearProfile: () => {
    set({ profileUser: null, loading: false, error: null });
    toast.success("Profile cleared");
    emitter.emit("PROFILE_CLEARED", null);
  },

  syncUserData: (user) => {
    set((state) => ({
      profileUser:
        state.profileUser && state.profileUser._id === user?._id
          ? { ...user, posts: state.profileUser.posts } // Preserve posts
          : state.profileUser,
    }));
  },

  on: (event, callback) => emitter.on(event, callback),
  off: (event, callback) => emitter.off(event, callback),
}));

export default useProfileStore;

export const useSyncProfile = () => {
  useEffect(() => {
    emitter.on("USER_UPDATED", (user) => {
      useProfileStore.getState().syncUserData(user);
    });
  }, []);
};
