// src/client/components/FollowersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";
import { useSocket } from "../hooks/useSocket.hook";
import toast from "react-hot-toast";

const FollowersPage = () => {
  const { authUser } = useAuthStore();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [followers, setFollowers] = useState([]);
  const [suggestions, setSuggestions] = useState([]);

  const fetchFollowers = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get(`/user/${authUser._id}`);
      setFollowers(data.followers || []);
    } catch (error) {
      console.error("Error fetching followers:", error);
      toast.error("Failed to load followers");
    }
  }, [authUser]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/user/suggestions");
      setSuggestions(data || []);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      toast.error("Failed to load suggestions");
    }
  }, []);

  useEffect(() => {
    if (authUser?._id) {
      fetchFollowers();
      fetchSuggestions();
    }
  }, [authUser, fetchFollowers, fetchSuggestions]);

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on("followUpdate", ({ followerId, followers }) => {
      setFollowers(followers || []);
    });

    return () => {
      socket.off("followUpdate");
    };
  }, [socket, connected]);

  const handleFollow = async (userId) => {
    try {
      await axiosInstance.post(`/users/follow/${userId}`);
      toast.success("Followed successfully");
      fetchSuggestions();
      fetchFollowers();
    } catch (error) {
      console.error("Error following user:", error);
      toast.error("Failed to follow");
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-base-content">Followers</h1>
          </div>
        </div>

        {/* Followers */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Your Followers</h2>
          {followers.length > 0 ? (
            <div className="space-y-4">
              {followers.map((follower) => (
                <div
                  key={follower._id}
                  className="flex items-center gap-4 p-4 bg-base-200 rounded-lg">
                  <img
                    src={follower.profilePic || "./placeholder.jpeg"}
                    alt="Follower"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => (e.target.src = "./placeholder.jpeg")}
                  />
                  <p
                    className="text-base-content font-semibold cursor-pointer"
                    onClick={() => navigate(`/profile/${follower._id}`)}>
                    {follower.username}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/60">No followers yet!</p>
          )}
        </div>

        {/* Suggestions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Suggested for You</h2>
          {suggestions.length > 0 ? (
            <div className="space-y-4">
              {suggestions.map((user) => (
                <div
                  key={user._id}
                  className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.profilePic || "./placeholder.jpeg"}
                      alt="User"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => (e.target.src = "./placeholder.jpeg")}
                    />
                    <p
                      className="text-base-content font-semibold cursor-pointer"
                      onClick={() => navigate(`/profile/${user._id}`)}>
                      {user.username}
                    </p>
                  </div>
                  <button
                    onClick={() => handleFollow(user._id)}
                    className="btn btn-primary btn-sm flex items-center gap-2">
                    <UserPlus size={16} />
                    Follow
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base-content/60">No suggestions available</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FollowersPage;
