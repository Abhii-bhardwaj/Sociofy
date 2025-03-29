// store/useProfileStore.js
import { create } from "zustand";
import axios from "axios";
import toast from "react-hot-toast";
import mitt from "mitt";

const emitter = mitt();

const useProfileStore = create((set) => ({
  profileUser: null, // Target user data
  loading: true, // Loading state
  error: null, // Error state

  // Action to fetch profile data
  fetchProfileUser: async (userId, authUser, fetchPosts) => {
    set({ loading: true, error: null });
    try {
      console.log("Fetching profile for userId:", userId);
      console.log("Logged-in authUser ID:", authUser?._id);

      if (userId === authUser?._id) {
        console.log("UserId matches authUser, using authUser data");
        set({ profileUser: authUser });
        await fetchPosts(authUser._id);
        toast.success("Profile loaded successfully");
        emitter.emit("PROFILE_UPDATED", authUser);
      } else {
        console.log("Fetching user data from API for userId:", userId);
        const { data } = await axios.get(
          `http://localhost:5001/api/user/profile/${userId}`,
          { withCredentials: true }
        );
        console.log("Fetched user data from API:", data);
        set({ profileUser: data });
        await fetchPosts(data._id);
        toast.success(`${data.fullName}'s profile loaded successfully`);
        emitter.emit("PROFILE_UPDATED", data);
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to load profile";
      console.error(
        "Error fetching profile:",
        error.response?.data || error.message
      );
      set({ error: errorMsg, profileUser: null });
      toast.error(errorMsg);
      emitter.emit("PROFILE_ERROR", errorMsg);
    } finally {
      set({ loading: false });
    }
  },

  // Action to clear profile data
  clearProfile: () => {
    set({ profileUser: null, loading: false, error: null });
    toast.success("Profile cleared");
    emitter.emit("PROFILE_CLEARED", null);
  },

  // Optional: Subscribe to events outside the store
  on: (event, callback) => emitter.on(event, callback),
  off: (event, callback) => emitter.off(event, callback),
}));

export default useProfileStore;
