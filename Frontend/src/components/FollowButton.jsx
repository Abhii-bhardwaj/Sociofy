import { useFollowStore } from "../store/useFollowStore";

const FollowButton = ({ userId }) => {
  const { following, toggleFollow, loading } = useFollowStore();
  const isFollowing = following.has(userId);

  return (
    <button
      onClick={() => toggleFollow(userId)}
      disabled={loading || !userId}
      className={`px-4 py-1 rounded-md btn transition-all duration-300 ${
        isFollowing ? "btn-error" : "btn-primary"
      }`}>
      {loading ? "Processing..." : isFollowing ? "Unfollow" : "Follow"}
    </button>
  );
};

export default FollowButton;
