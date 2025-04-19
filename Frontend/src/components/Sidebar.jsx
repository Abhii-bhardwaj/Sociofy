// src/client/components/Sidebar.jsx
import React, { useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useSyncSidebar } from "../store/useSidebarStore";
import { useNotifications } from "../hooks/useNotification.hook";
import {
  FaHome,
  FaUsers,
  FaBell,
  FaEnvelope,
  FaCog,
  FaSignOutAlt,
  FaPlusSquare,
} from "react-icons/fa";

const Sidebar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { authUser, logout } = useAuthStore();
  const { unreadCount } = useNotifications();
  useSyncSidebar();

  console.log("Sidebar rendering, unreadCount:", unreadCount);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const openModal = () => {
    navigate("/create-post");
    setIsOpen(false);
  };

  const handleProfileClick = () => {
    if (authUser?.username) {
      navigate(`/profile/${authUser.username}`);
    } else {
      navigate("/profile");
    }
    setIsOpen(false);
  };

  const menuItems = [
    { name: "Home", icon: <FaHome />, path: "/" },
    { name: "Friend Requests", icon: <FaUsers />, path: "/friends" },
    { name: "Add Post", icon: <FaPlusSquare />, action: openModal },
    {
      name: "Notifications",
      icon: (
        <div className="relative">
          <FaBell />
          {unreadCount > 0 && (
            <span className="badge badge-primary badge-xs absolute -top-2 -right-2">
              {unreadCount}
            </span>
          )}
        </div>
      ),
      path: "/notifications",
    },
    { name: "Messages", icon: <FaEnvelope />, path: "/messages" },
    { name: "Settings", icon: <FaCog />, path: "/settings" },
  ];

  if (!authUser) {
    return (
      <div className="hidden md:block fixed inset-y-0 left-0 w-64 p-4 bg-base-100 border-r border-base-300">
        {/* Loading state */}
      </div>
    );
  }

  return (
    <div
      className={`hidden md:block fixed inset-y-0 left-0 w-64 bg-base-100 text-base-content p-4 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform md:translate-x-0 md:relative md:w-1/5 border-r border-base-300`}>
      <button
        onClick={handleProfileClick}
        className="cursor-pointer outline-none hover:opacity-80 transition-opacity">
        <div className="flex items-center mb-6">
          <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center">
            <img
              src={authUser?.profilePic || "https://via.placeholder.com/48"}
              alt="Profile Picture"
              className="w-12 h-12 object-cover rounded-full"
              onError={(e) => (e.target.src = "https://via.placeholder.com/48")}
            />
          </div>
          <div className="ml-4">
            <h3 className="text-lg font-semibold text-base-content">
              {authUser?.username || "Guest"}
            </h3>
          </div>
        </div>
      </button>

      <ul className="text-lg list-none">
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="mb-2 flex items-center p-2 rounded cursor-pointer hover:bg-base-300 hover:text-base-content/80 transition-colors duration-200"
            onClick={() => {
              if (item.path) navigate(item.path, { replace: false });
              if (item.action) item.action();
            }}>
            <span className="mr-3 text-xl">{item.icon}</span>
            <span>{item.name}</span>
          </li>
        ))}
      </ul>

      <div className="mt-auto text-lg">
        <button
          className="flex items-center space-x-2 p-2 rounded w-full text-error hover:text-error/80 hover:bg-error/10 transition-colors duration-200"
          onClick={handleLogout}>
          <FaSignOutAlt className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
