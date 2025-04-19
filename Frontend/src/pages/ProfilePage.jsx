import React, { useEffect, useCallback } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import useProfileStore from "../store/useProfileStore";
import PostCard from "../components/PostCard";
import EditProfileModal from "../components/EditProfileModal";
import FollowButton from "../components/FollowButton";
import FollowModal from "../modal/FollowModal";

const ProfilePage = () => {
  const { authUser } = useAuthStore();
  const { username } = useParams();
  const { profileUser, loading, error, fetchProfileUser } = useProfileStore();
  const navigate = useNavigate();
  const location = useLocation();

  const modalType = location.pathname.includes("followers")
    ? "followers"
    : location.pathname.includes("following")
    ? "following"
    : null;

  const memoizedFetchProfileUser = useCallback(() => {
    if (authUser) {
      fetchProfileUser(username, authUser);
    }
  }, [username, authUser, fetchProfileUser]);

  useEffect(() => {
    memoizedFetchProfileUser();
  }, [memoizedFetchProfileUser]);

  const handleShowFollowers = () => {
    navigate(`/profile/${username}/followers`);
  };

  const handleShowFollowing = () => {
    navigate(`/profile/${username}/following`);
  };

  const handleModalClose = () => {
    navigate(`/profile/${username}`);
  };

  const handleProfileVisit = (targetUsername) => {
    handleModalClose();
    navigate(`/profile/${targetUsername}`);
  };

  if (loading || !authUser) {
    return (
      <div className="h-screen flex items-center justify-center">
        Loading profile...
      </div>
    );
  }

  if (!profileUser || error) {
    return (
      <div className="h-screen flex items-center justify-center flex-col">
        <p>{error ? `Error: ${error}` : "User not found."}</p>
        <button
          onClick={() => navigate("/home")}
          className="mt-4 btn btn-primary">
          Go Back
        </button>
      </div>
    );
  }

  console.log("Profile User Data in ProfilePage:", profileUser);
  console.log("Profile User Posts:", profileUser.posts);

  const isOwnProfile = authUser.username === profileUser.username;
  const profilePicUrl = profileUser.profilePic.startsWith("/")
    ? `http://localhost:5001${profileUser.profilePic}`
    : profileUser.profilePic;

  return (
    <div className="min-h-screen bg-base-100 px-4 md:px-8">
      <div className="max-w-6xl mx-auto p-4 md:p-6 relative">
        {/* <button onClick={() => navigate("/")} className="mb-4 btn btn-primary">
          Back
        </button> */}

        <div className="bg-base-200 shadow-xl rounded-xl p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="avatar">
              <div className="w-20 sm:w-24 rounded-full border-2 border-primary">
                <img
                  src={profilePicUrl}
                  alt="Profile"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="text-center sm:text-left">
              <div className="flex gap-4 items-center">
                <h1 className="text-xl sm:text-2xl font-bold">
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
              <p className="text-md mt-2">
                {profileUser.bio || "No bio added."}
              </p>
              <div className="flex justify-center sm:justify-start gap-4 mt-2 text-sm">
                <button
                  onClick={handleShowFollowers}
                  className="hover:underline focus:outline-none">
                  {profileUser.followers?.length || 0} Followers
                </button>
                <button
                  onClick={handleShowFollowing}
                  className="hover:underline focus:outline-none">
                  {profileUser.following?.length || 0} Following
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg sm:text-xl font-bold mb-4">
            {isOwnProfile ? "Your Posts" : `${profileUser.fullName}'s Posts`}
          </h2>
          {profileUser.posts && profileUser.posts.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-6">
              {profileUser.posts.map((post) => (
                <PostCard
                  key={post._id}
                  postId={post._id}
                  userId={post.user._id}
                  userImage={post.user.profilePic}
                  userName={post.user.username}
                  time={new Date(post.createdAt).toLocaleString()} // Format time
                  content={post.caption}
                  images={post.postImage} // Pass postImage as images
                />
              ))}
            </div>
          ) : (
            <p className="text-center">No posts yet.</p>
          )}
        </div>

        {modalType && (
          <FollowModal
            modalType={modalType}
            username={username}
            authUser={authUser}
            onClose={handleModalClose}
            onProfileVisit={handleProfileVisit}
          />
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
