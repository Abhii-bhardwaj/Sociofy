import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import emitter from "../lib/eventEmitter";

export const useFollowStore = create((set, get) => ({
  following: [],
  followers: [],
  loading: false,

  fetchFollowing: async (username) => {
    if (!username) {
      console.error("No username provided to fetchFollowing");
      return;
    }
    try {
      const response = await axiosInstance.get(`/user/${username}/following`, {
        withCredentials: true,
      });
      set({ following: response.data.following });
      // console.log("Fetched following:", response.data.following);
    } catch (error) {
      console.error("Error fetching following list", error);
    }
  },

  fetchFollowers: async (username) => {
    if (!username) {
      console.error("No username provided to fetchFollowers");
      return;
    }
    try {
      const response = await axiosInstance.get(`/user/${username}/followers`, {
        withCredentials: true,
      });
      set({ followers: response.data.followers });
      // console.log("Fetched followers:", response.data.followers);
    } catch (error) {
      console.error("Error fetching followers list", error);
    }
  },

  toggleFollow: async (targetUserId) => {
    if (!targetUserId) {
      console.error("No targetUserId provided to toggleFollow");
      return;
    }
    if (get().loading) return;

    set({ loading: true });
    try {
      const currentFollowing = get().following;
      const isFollowing = currentFollowing.some(
        (user) => user._id === targetUserId
      );
      const endpoint = isFollowing
        ? `/user/unfollow/${targetUserId}`
        : `/user/follow/${targetUserId}`;

      // Optimistic update for instant UI feedback
      if (isFollowing) {
        set({
          following: currentFollowing.filter(
            (user) => user._id !== targetUserId
          ),
        });
      } else {
        const newFollowingUser = { _id: targetUserId }; // Minimal data, socket will fill rest
        set({
          following: [...currentFollowing, newFollowingUser],
        });
      }

      await axiosInstance.get(endpoint, { withCredentials: true });

      toast.success(
        isFollowing ? "Unfollowed successfully" : "Followed successfully"
      );
      // Socket will sync the final state, no need for further local update here
    } catch (error) {
      console.error("Error toggling follow status", error);
      toast.error(error.response?.data?.message || "Action failed");
      // Rollback optimistic update on error
      get().fetchFollowing(localStorage.getItem("username")); // Adjust based on your auth
    } finally {
      set({ loading: false });
    }
  },

  followUser: async (targetUserId) => {
    await get().toggleFollow(targetUserId); // Reuse toggleFollow logic
  },

  unfollowUser: async (targetUserId) => {
    await get().toggleFollow(targetUserId); // Reuse toggleFollow logic
  },

  syncUserData: (user) => {
    if (user) {
      useFollowStore.getState().fetchFollowing(user.username);
      useFollowStore.getState().fetchFollowers(user.username);
    }
  },

  initializeSocket: (socket) => {
    socket.on(
      "followUpdate",
      ({ followerId, followingId, following, followers }) => {
        const currentUserId = localStorage.getItem("userId"); // Adjust based on your auth
        if (currentUserId === followerId) {
          set({ following, loading: false });
          console.log("Follow update synced:", following);
        }
        if (currentUserId === followingId) {
          set({ followers, loading: false });
        }
      }
    );

    socket.on(
      "unfollowUpdate",
      ({ followerId, followingId, following, followers }) => {
        const currentUserId = localStorage.getItem("userId"); // Adjust based on your auth
        if (currentUserId === followerId) {
          set({ following, loading: false });
          console.log("Unfollow update synced:", following);
        }
        if (currentUserId === followingId) {
          set({ followers, loading: false });
        }
      }
    );
  },
}));

export const useSyncFollow = () => {
  useEffect(() => {
    emitter.on("USER_UPDATED", (user) => {
      useFollowStore.getState().syncUserData(user);
    });
  }, []);
};
