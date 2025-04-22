// src/client/components/TopBar.jsx
import React, { useState, useEffect, useRef } from "react";
import { Bell, Mail, Settings } from "lucide-react";
import SociofyLogo from "../assets/Sociofy_logo_.webp";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useNotifications } from "../hooks/useNotification.hook";

const TopBar = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const searchRef = useRef(null);

  console.log("TopBar rendering, unreadCount:", unreadCount);

  const handleNotificationsClick = (e) => {
    e.preventDefault();
    navigate("/notifications");
  };

  const handleMessagesClick = (e) => {
    e.preventDefault();
    navigate("/messages");
    toast.success("Opening Messages!");
  };

  const handleSettingsClick = (e) => {
    e.preventDefault();
    navigate("/settings");
    toast.success("Opening Settings!");
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim().length > 0) {
      try {
        const { data } = await axiosInstance.get(
          `/user/search?query=${query}`,
          {
            withCredentials: true,
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

  const handleUserClick = (username) => {
    if (!username) return;
    navigate(`/profile/${username}`);
    setSearchQuery("");
    setSearchResults([]);
    setIsSearchOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen]);

  return (
    <div className="bg-base-100 text-base-content px-2 py-3 flex items-center justify-between w-full gap-x-2 sm:gap-x-4 lg:gap-x-6">
      <div className="flex items-center gap-x-2 sm:gap-x-4 flex-1 min-w-0">
        <img
          src={SociofyLogo}
          alt="Logo"
          className="h-6 xs:h-8 sm:h-10 md:h-12 object-contain flex-shrink-0"
        />
        <div
          ref={searchRef}
          className="relative w-full xs:w-48 sm:w-56 md:w-72 lg:w-96 xl:w-[500px]">
          <input
            className="input input-bordered bg-base-200 text-base-content px-2 py-1 xs:px-3 xs:py-1 sm:px-4 sm:py-2 rounded-full w-full text-xs xs:text-sm sm:text-base min-w-0 focus:outline-none"
            placeholder="Search..."
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            style={{ height: "32px xs:34px sm:36px" }}
          />
          {isSearchOpen && (
            <div className="absolute top-10 xs:top-11 sm:top-12 left-0 bg-base-200 text-base-content rounded-lg shadow-lg w-full max-h-80 overflow-y-auto z-20">
              {searchResults.length > 0 ? (
                searchResults.map((user) => (
                  <div
                    key={user.username}
                    className="flex items-center gap-2 xs:gap-3 p-2 xs:p-3 hover:bg-base-300 cursor-pointer"
                    onClick={() => handleUserClick(user.username)}>
                    <img
                      src={user.profilePic || "https://via.placeholder.com/40"}
                      alt={user.fullName}
                      className="w-8 h-8 xs:w-10 xs:h-10 object-cover rounded-full flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs xs:text-sm truncate">
                        {user.fullName || user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.followerCount} followers
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-2 xs:p-3 text-center">
                  <p className="text-xs xs:text-sm text-gray-500">
                    No results found
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-x-2 xs:gap-x-3 sm:gap-x-4 lg:gap-x-6 flex-shrink-0">
        <div className="relative" onClick={handleNotificationsClick}>
          <Bell className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 hover:scale-125 cursor-pointer transition-transform duration-200 text-base-content" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 xs:-top-2 xs:-right-2 badge badge-primary badge-xs">
              {unreadCount}
            </span>
          )}
        </div>
        <Mail
          className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 hover:scale-125 cursor-pointer transition-transform duration-200 text-base-content"
          onClick={handleMessagesClick}
        />
        <Settings
          className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 hover:scale-125 cursor-pointer transition-transform duration-200 text-base-content"
          onClick={handleSettingsClick}
        />
      </div>
    </div>
  );
};

export default TopBar;
