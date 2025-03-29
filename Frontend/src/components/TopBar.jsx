import React, { useState, useEffect } from "react";
import { Bell, Mail, Settings } from "lucide-react";
import SociofyLogo from "../assets/Sociofy_logo_.webp";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast"; // Assuming you're using react-hot-toast for notifications
import ChatContainer from "./chat/ChatContainer"; // New import
import { axiosInstance } from "../lib/axios";

const TopBar = () => {
  const navigate = useNavigate();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Action for Bell (Notifications)
  const handleNotificationsClick = (e) => {
    e.preventDefault();
    setIsNotificationsOpen((prev) => !prev);
    toast("Notifications toggled!", { icon: "🔔" });
    // Add logic here: e.g., fetch notifications or toggle a dropdown
    console.log("Notifications clicked - Open:", !isNotificationsOpen);
  };

  const handleMessagesClick = (e) => {
    e.preventDefault();
    navigate("/messages"); // Navigate to /messages route
    toast.success("Opening Messages!");
  };

  // Action for Settings (Settings Menu)
  const handleSettingsClick = (e) => {
    e.preventDefault();
    navigate("/settings");
    toast.success("Opening Settings!");
    // Add logic here: e.g., open settings modal or navigate to settings page
    console.log("Settings clicked");
  };

  // Handle Search Input
  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        const { data } = await axiosInstance.get(
          `/user/search?query=${query}`,
          {
            withCredentials: true, // Send JWT cookie
          }
        );
        setSearchResults(data);
        setIsSearchOpen(true);
      } catch (error) {
        console.error("Error fetching search results:", error);
        toast.error("Search failed!");
        setSearchResults([]);
        setIsSearchOpen(false);
      }
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  };

  // Navigate to user profile
  const handleUserClick = (userId) => {
    navigate(`/profile/${userId}`);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  return (
    <div className="bg-base-100 text-base-content p-3 flex items-center justify-between w-full gap-x-4">
      {/* Logo and Search Bar Container */}
      <div className="flex items-center gap-x-2 sm:gap-x-4 flex-1 min-w-0">
        <img
          src={SociofyLogo}
          alt="Logo"
          className="h-8 sm:h-10 md:h-12 object-contain"
        />
        <div className="relative w-full sm:w-56 md:w-72 lg:w-96">
          <input
            className="input input-bordered bg-base-200 text-base-content px-3 py-1 sm:px-4 sm:py-2 rounded-full w-full text-sm sm:text-base min-w-0"
            placeholder="Search..."
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            style={{ height: "36px" }}
          />
          {/* Search Results Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-12 left-0 bg-base-200 text-base-content rounded-lg shadow-lg w-full max-h-96 overflow-y-auto z-10">
              {searchResults.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-3 hover:bg-base-300 cursor-pointer"
                  onClick={() => handleUserClick(user.id)}>
                  <img
                    src={user.profilePic || "https://via.placeholder.com/40"}
                    alt={user.fullName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <p className="font-semibold">
                      {user.fullName || user.username}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.followerCount} followers
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {isSearchOpen && searchResults.length === 0 && (
            <div className="absolute top-12 left-0 bg-base-200 text-base-content rounded-lg shadow-lg w-full p-3 z-10">
              <p className="text-sm text-gray-500">No results found</p>
            </div>
          )}
        </div>
      </div>

      {/* Icons Section */}
      <div className="flex items-center gap-x-4 sm:gap-x-6">
        <Bell
          className="w-5 h-5 sm:w-6 sm:h-6 hover:scale-125 cursor-pointer transition-transform duration-200 text-base-content"
          onClick={handleNotificationsClick}
        />
        <Mail
          className="w-5 h-5 sm:w-6 sm:h-6 hover:scale-125 cursor-pointer transition-transform duration-200 text-base-content"
          onClick={handleMessagesClick}
        />
        <Settings
          className="w-5 h-5 sm:w-6 sm:h-6 hover:scale-125 cursor-pointer transition-transform duration-200 text-base-content"
          onClick={handleSettingsClick}
        />
      </div>

      {/* Optional: Notifications Dropdown (Example) */}
      {isNotificationsOpen && (
        <div className="absolute top-14 right-4 bg-base-200 text-base-content p-4 rounded-lg shadow-lg w-64">
          <h3 className="text-lg font-semibold text-base-content">
            Notifications
          </h3>
          <p>No new notifications</p>
          {/* Add real notifications logic here */}
        </div>
      )}
    </div>
  );
};

export default TopBar;
