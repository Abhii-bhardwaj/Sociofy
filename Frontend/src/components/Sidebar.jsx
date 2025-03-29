import React, { useState, useEffect } from "react";
import { useCreatePostStore } from "../store/useCreatePostStore.js";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate, useLocation } from "react-router-dom";
import toast from "react-hot-toast";
import CreatePost from "../modal/CreatePost";
import useUser from "../hooks/useUser.hook.js";
import {
  Home,
  Users,
  Bell,
  Mail,
  Settings,
  LogOut,
  SquarePlus,
} from "lucide-react"; 

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const resetState = useCreatePostStore((state) => state.resetState);
  const user = useUser();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    setIsModalOpen(queryParams.get("modal") === "open");
  }, [location.search]);

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const openModal = () => {
    navigate(`${location.pathname}?modal=open`);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    navigate(location.pathname);
    setIsModalOpen(false);
    resetState();
  };

  const handleProfileClick = () => { 
    navigate(`/profile/${user._id}`);
    setIsOpen(false);
  }

  const menuItems = [
    { name: "Home", icon: <Home />, path: "/" },
    { name: "Friends", icon: <Users />, path: "/friends" },
    { name: "Add Post", icon: <SquarePlus />, action: openModal },
    { name: "Notifications", icon: <Bell /> },
    { name: "Messages", icon: <Mail /> },
    { name: "Settings", icon: <Settings />, path: "/settings" },
    { name: "Logout", icon: <LogOut />, action: handleLogout },
  ];

  if (!user) {
    return (
      <div className="hidden md:block fixed inset-y-0 left-0 w-64 p-4  bg-base-100 border-r border-base-300">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-base-300 rounded-full animate-pulse"></div>
          <div className="flex flex-col space-y-2">
            <div className="h-4 w-24 bg-base-300 rounded animate-pulse"></div>
            <div className="h-3 w-16 bg-base-300 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          {[...Array(6)].map((_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-base-300 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-base-300 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    )
  };
  return (
    <div
      className={`hidden md:block fixed inset-y-0 left-0 w-64  bg-base-100 text-base-content p-4 transform ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform md:translate-x-0 md:relative md:w-1/5 border-r border-base-300`}>
      <div className="flex items-center mb-6">
        <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center">
          <button
            onClick={handleProfileClick}
            className="rounded-full w-12 h-12 cursor-pointer">
            <img
              src={user?.profilePic || "https://via.placeholder.com/48"}
              alt="Profile Picture"
              className="w-full h-full object-cover rounded-full"
            />
          </button>
        </div>
        <div className="ml-4">
          <button
            onClick={handleLogout}
            className="btn btn-error px-4 py-2 rounded-full cursor-pointer">
            Logout
          </button>
        </div>
      </div>
      <ul>
        {menuItems.map((item, index) => (
          <li
            key={index}
            className="mb-4 text-xl flex items-center space-x-2 cursor-pointer text-base-content hover:text-base-content/60"
            onClick={() => {
              if (item.path) navigate(item.path, { replace: false });
              if (item.action) item.action();
            }}>
            {item.icon}
            <span>{item.name}</span>
          </li>
        ))}
      </ul>
      <CreatePost isOpen={isModalOpen} onClose={closeModal} />
    </div>
  );}

export default Sidebar;
