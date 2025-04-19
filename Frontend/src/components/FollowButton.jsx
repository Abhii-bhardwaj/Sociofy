import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useFollowStore } from "../store/useFollowStore";

const FollowButton = ({ userId, initialFollowing = false }) => {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const { toggleFollow, following, loading } = useFollowStore();

  // Sync local state with store
  useEffect(() => {
    const isUserFollowing = following.some((user) => user._id === userId);
    setIsFollowing(isUserFollowing);
  }, [following, userId]);

  const handleFollowToggle = async () => {
    try {
      await toggleFollow(userId);
    } catch (error) {
      console.error("Error in FollowButton:", error);
    }
  };

  return (
    <button
      onClick={handleFollowToggle}
      disabled={loading}
      className={`btn ${isFollowing ? "btn-outline" : "btn-primary"} btn-sm`}>
      {loading ? "Loading..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
};

export default FollowButton;
