import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
export const useFollowStore = create((set, get) => ({
  following: new Set(),
  loading: false,

  fetchFollowing: async (userId) => {
    if (!userId) {
      console.error("No userId provided to fetchFollowing");
      return;
    }
    try {
      const response = await axiosInstance.get(`/user/follow/${userId}`);
      set({ following: new Set(response.data) });
    } catch (error) {
      console.error("Error fetching following list", error);
    }
  },

  toggleFollow: async (userId) => {
    if (!userId) {
      console.error("No userId provided to toggleFollow");
      return;
    }
    if (get().loading) return;
    set({ loading: true });

    try {
      const isFollowing = get().following.has(userId);
      await axiosInstance.get(
        `/user/${isFollowing ? "unfollow" : "follow"}/${userId}`
      );

      set((state) => {
        const updatedFollowing = new Set(state.following);
        isFollowing
          ? updatedFollowing.delete(userId)
          : updatedFollowing.add(userId);
        return { following: updatedFollowing, loading: false };
      });
    } catch (error) {
      console.error("Error toggling follow status", error);
      set({ loading: false });
    }
  },
}));
