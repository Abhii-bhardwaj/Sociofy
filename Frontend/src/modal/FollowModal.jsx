// components/FollowModal.jsx
import React, { useState, useEffect } from "react";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import FollowButton from "../components/FollowButton";
import { useFollowStore } from "../store/useFollowStore";

const FollowModal = ({
  modalType,
  username,
  authUser,
  onClose,
  onProfileVisit,
}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const { following } = useFollowStore();

  const fetchData = async () => {
    setLoading(true);
    try {
      const endpoint =
        modalType === "followers"
          ? `/user/${username}/followers`
          : `/user/${username}/following`;
      const { data } = await axiosInstance.get(endpoint, {
        withCredentials: true,
      });
      setData(modalType === "followers" ? data.followers : data.following);
      console.log(`Fetched ${modalType}:`, data);
    } catch (error) {
      console.error(
        `Error fetching ${modalType}:`,
        error.response?.data || error.message
      );
      toast.error(`Failed to load ${modalType}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (modalType) fetchData();
  }, [modalType, username]);

  // Function to determine the correct image source
  const getProfilePicSrc = (profilePic) => {
    if (!profilePic) return "/default-avatar.png"; // Fallback if no profilePic
    if (profilePic.startsWith("http")) return profilePic; // External URL
    return `/${profilePic}`; // Local file in public folder
  };

  return (
    <div className="modal modal-open fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="modal-box max-w-lg bg-base-100 rounded-lg shadow-lg">
        <h3 className="font-bold text-lg mb-4">
          {modalType === "followers" ? "Followers" : "Following"}
        </h3>
        <div className="max-h-80 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-center">Loading...</p>
          ) : data.length > 0 ? (
            data.map((user) => {
              const isFollowing = following.some((f) => f._id === user._id);
              return (
                <div
                  key={user._id}
                  className="flex items-center justify-between gap-3 p-2 hover:bg-base-200 rounded">
                  <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => onProfileVisit(user.username)}>
                    <img
                      src={getProfilePicSrc(user.profilePic)}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => (e.target.src = "/default-avatar.png")} // Fallback on error
                    />
                    <div>
                      <p className="font-semibold">
                        {user.fullName || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-500">@{user.username}</p>
                    </div>
                  </div>
                  {user._id !== authUser._id && (
                    <FollowButton
                      userId={user._id}
                      initialFollowing={isFollowing}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <p className="text-center">
              {modalType === "followers"
                ? "No followers yet."
                : "Not following anyone yet."}
            </p>
          )}
        </div>
        <div className="modal-action mt-4">
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FollowModal;
