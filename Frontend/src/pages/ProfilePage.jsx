import { useAuthStore } from "../store/useAuthStore";
import { useFollowStore } from "../store/useFollowStore";
import { usePostStore } from "../store/usePostStore";
import { useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PostCard from "../components/PostCard";
import EditProfileModal from "../components/EditProfileModal";
import FollowButton from "../components/FollowButton";
import useProfileStore from "../store/useProfileStore";

const ProfilePage = () => {
  const { authUser } = useAuthStore();
  const { posts, fetchPosts } = usePostStore();
  const { fetchFollowing } = useFollowStore();
  const { userId } = useParams();
  const { profileUser, loading, error, fetchProfileUser } = useProfileStore();
  const navigate = useNavigate();

  const memoizedFetchProfileUser = useCallback(() => {
    if (authUser) {
      fetchProfileUser(userId, authUser, fetchPosts);
    }
  }, [userId, authUser, fetchPosts, fetchProfileUser]);

  useEffect(() => {
    fetchFollowing();
  }, [fetchFollowing]);

  useEffect(() => {
    memoizedFetchProfileUser();
  }, [memoizedFetchProfileUser]);

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      const history = JSON.parse(sessionStorage.getItem("history")) || [];
      const previousPage =
        history.length > 1 ? history[history.length - 2] : "/home";
      console.log("Browser back button pressed, navigating to:", previousPage);

      // Update history stack by removing the current page
      if (history.length > 0) {
        history.pop(); // Remove current page
        sessionStorage.setItem("history", JSON.stringify(history));
      }

      // Navigate to the previous page
      navigate(previousPage, { replace: true });
    };

    // Add event listener for popstate (browser back/forward)
    window.addEventListener("popstate", handlePopState);

    // Cleanup event listener on component unmount
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [navigate]);

  useEffect(() => {
    const handleProfileUpdated = (user) => {
      console.log("Profile updated event received:", user);
    };
    const handleProfileError = (err) => {
      console.log("Profile error event received:", err);
      if (err === "User not found") {
        const history = JSON.parse(sessionStorage.getItem("history")) || [];
        const previousPage =
          history.length > 1 ? history[history.length - 2] : "/home";
        navigate(previousPage);
      }
    };

    useProfileStore.getState().on("PROFILE_UPDATED", handleProfileUpdated);
    useProfileStore.getState().on("PROFILE_ERROR", handleProfileError);

    return () => {
      useProfileStore.getState().off("PROFILE_UPDATED", handleProfileUpdated);
      useProfileStore.getState().off("PROFILE_ERROR", handleProfileError);
    };
  }, [navigate]);

  if (loading || !authUser) {
    return (
      <div className="h-screen flex items-center justify-center px-4 bg-base-100">
        <p className="text-lg font-semibold text-base-content/60 text-center">
          Loading profile...
        </p>
      </div>
    );
  }

  if (!profileUser || error) {
    return (
      <div className="h-screen flex items-center justify-center px-4 bg-base-100">
        <p className="text-lg font-semibold text-base-content/60 text-center">
          {error ? `Error: ${error}` : "User not found."}
        </p>
        <button
          onClick={() => {
            const history = JSON.parse(sessionStorage.getItem("history")) || [];
            const previousPage =
              history.length > 1 ? history[history.length - 2] : "/home";
            navigate(previousPage);
          }}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg">
          Go Back
        </button>
      </div>
    );
  }

  const isOwnProfile = authUser._id === profileUser._id;

  const profilePicUrl = profileUser.profilePic.startsWith("/public")
    ? `http://localhost:5001${profileUser.profilePic}`
    : profileUser.profilePic;
  console.log("ProfilePic URL being used:", profilePicUrl);

  return (
    <div className="min-h-screen bg-base-100 px-4 md:px-8">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Back Button (still works the same way) */}
        <button
          onClick={() => {
            const history = JSON.parse(sessionStorage.getItem("history")) || [];
            const previousPage =
              history.length > 1 ? history[history.length - 2] : "/home";
            // Update history stack
            if (history.length > 0) {
              history.pop();
              sessionStorage.setItem("history", JSON.stringify(history));
            }
            navigate(previousPage);
          }}
          className="mb-4 px-4 py-2 bg-primary text-white rounded-lg">
          Back
        </button>

        {/* Profile Section */}
        <div className="bg-base-200 shadow-xl rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="avatar">
              <div className="w-20 sm:w-24 rounded-full border-2 border-primary">
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  className="object-cover"
                  onError={(e) => {
                    console.log("Image failed to load:", profilePicUrl);
                    e.target.src = "https://via.placeholder.com/150";
                  }}
                />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex gap-4">
                <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                  {profileUser.fullName || "User"}
                </h1>
                {isOwnProfile ? (
                  <EditProfileModal />
                ) : (
                  <FollowButton userId={profileUser._id} />
                )}
              </div>
              <p className="text-sm text-base-content/60">
                @{profileUser.username || "unknown"}
              </p>
              <p className="text-md mt-2 text-base-content/80">
                {profileUser.bio || "No bio added."}
              </p>
              <div className="flex justify-center sm:justify-start gap-4 mt-2 text-sm text-base-content">
                <span>{profileUser.followers?.length || 0} Followers</span>
                <span>{profileUser.following?.length || 0} Following</span>
              </div>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="mt-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4 text-center sm:text-left text-base-content">
            {isOwnProfile ? "Your Posts" : `${profileUser.fullName}'s Posts`}
          </h2>
          {loading ? (
            <Skeleton count={4} />
          ) : posts.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  userId={post.user?._id}
                  images={post.postImage || []}
                  userName={profileUser.username}
                  userImage={profileUser.profilePic}
                  content={post.caption}
                  time={new Date(post.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
              ))}
            </div>
          ) : (
            <p className="text-base-content/60 text-center">No posts yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Skeleton Loader Component
const Skeleton = ({ count }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className="bg-base-300 animate-pulse h-32 sm:h-40 w-full rounded-lg"
        />
      ))}
    </div>
  );
};

export default ProfilePage;
