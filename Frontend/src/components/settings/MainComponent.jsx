import React,{useEffect} from "react";
import { FaSearch } from "react-icons/fa";
import { useSettingsStore } from "../../store/useSettingsStore";
import AccountSettings from "./SpecificPages/AccountSettings";
import EditProfile from "./SpecificPages/EditProfile";
import SavedPosts from "./SpecificPages/SavedPosts";
import PostSettings from "./SpecificPages/PostSettings";
import AppearanceSettings from "./SpecificPages/AppearanceSettings";
import Chatbot from "../Chatbot";
import { useLocation } from "react-router-dom";

const MainComponent = () => {
  const { selectedSetting, setSelectedSetting } = useSettingsStore();
  const location = useLocation();

useEffect(() => {
  if (location.pathname === "/settings") {
    setSelectedSetting("Account");
  }
}, [location.pathname, setSelectedSetting]);

  return (
    <div className="h-screen overflow-y-auto w-full p-4 md:p-8 bg-base-100">
      {/* Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="text-lg font-bold"></div>
        <div className="relative flex items-center justify-around w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Settings"
            className="text-base-content input-bordered input p-2 rounded-md w-48 md:w-64 pl-10"
          />
          <FaSearch className="absolute right-2 text-base-content/60 text-xl" />
        </div>
      </div>
      {/* Dynamic Content Based on Selected Setting */}
      {selectedSetting === "Account" && <AccountSettings />}
      {selectedSetting === "Edit Profile" && <EditProfile />}
      {selectedSetting === "Saved" && <SavedPosts />}
      {selectedSetting === "Post related settings" && <PostSettings />}
      {["Color Contrast", "Font Size", "Language", "Theme"].includes(
        selectedSetting
      ) && <AppearanceSettings />}

      {/* {selectedSetting === "Help & Support" && handleChatbot()} */}
      {/* {selectedSetting === "Help & Support" && (
  <div>
    <h2>Help & Support</h2>
    <Link to="/support/chat" className="btn btn-primary">
      Open Support Chat
    </Link>
  </div>)} */}
    </div>
  );
};

export default MainComponent;
