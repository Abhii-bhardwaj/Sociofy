import { useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { useSettingsStore } from "../../store/useSettingsStore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
  FaUserCircle,
  FaRegEdit,
  FaUserEdit,
  FaSave,
  FaPalette,
  FaAdjust,
  FaTextHeight,
  FaLanguage,
  FaMoon,
  FaLifeRing,
} from "react-icons/fa";
import { MdLogout } from "react-icons/md";
import SidebarItem from "./SidebarItem";

const Sidebar = ({ closeSidebar }) => {
  const [openDropdown, setOpenDropdown] = useState(null);
  const { selectedSetting, setSelectedSetting, darkMode, toggleDarkMode } =
    useSettingsStore();
  const navigate = useNavigate();

  const toggleDropdown = (name) => {
    setOpenDropdown(openDropdown === name ? null : name);
  };

  const handleSettingClick = (setting) => {
    if (setting === "Help & Support") {
      navigate("/support/chat");
    } else {
      setSelectedSetting(setting);
    }
    closeSidebar();
  };

  const handleLogout = async () => {
    try {
      await useAuthStore.getState().logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  return (
    <div className="w-64 h-full flex flex-col bg-base-100 text-base-content p-4 border-r border-base-300 overflow-y-auto">
      <button
        className="md:hidden self-end mb-4 text-2xl text-base-content"
        onClick={closeSidebar}>
        ✖
      </button>

      <div className="text-3xl font-bold mb-4 text-base-content">Settings</div>

      <ul className="text-lg list-none">
        <SidebarItem
          icon={FaUserCircle}
          text="Account"
          isActive={selectedSetting === "Account"}
          onClick={() => handleSettingClick("Account")}
        />
        <SidebarItem
          icon={FaUserEdit}
          text="Edit Profile"
          isActive={selectedSetting === "Edit Profile"}
          onClick={() => handleSettingClick("Edit Profile")}
        />
        <SidebarItem
          icon={FaSave}
          text="Saved"
          isActive={selectedSetting === "Saved"}
          onClick={() => handleSettingClick("Saved")}
        />
        <SidebarItem
          icon={FaRegEdit}
          text="Post related settings"
          isActive={selectedSetting === "Post related settings"}
          onClick={() => handleSettingClick("Post related settings")}
        />
        <SidebarItem
          icon={FaPalette}
          text="Appearance"
          dropdown
          isOpen={openDropdown === "appearance"}
          toggleDropdown={() => toggleDropdown("appearance")}>
          <SidebarItem
            icon={FaAdjust}
            text="Color Contrast"
            isActive={selectedSetting === "Color Contrast"}
            onClick={() => handleSettingClick("Color Contrast")}
          />
          <SidebarItem
            icon={FaTextHeight}
            text="Font Size"
            isActive={selectedSetting === "Font Size"}
            onClick={() => handleSettingClick("Font Size")}
          />
          <SidebarItem
            icon={FaLanguage}
            text="Language"
            isActive={selectedSetting === "Language"}
            onClick={() => handleSettingClick("Language")}
          />
          <SidebarItem
            icon={FaMoon}
            text={darkMode ? "Switch to Light" : "Switch to Dark"}
            isActive={selectedSetting === "Theme"}
            onClick={() => {
              handleSettingClick("Theme");
              toggleDarkMode();
            }}
          />
        </SidebarItem>
        <SidebarItem
          icon={FaLifeRing}
          text="Help & Support"
          isActive={selectedSetting === "Help & Support"}
          onClick={() => handleSettingClick("Help & Support")}
        />
      </ul>

      <div className="mt-auto text-lg">
        <button
          className="flex items-center space-x-2 text-error hover:text-error/80"
          onClick={handleLogout}>
          <MdLogout className="text-xl" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
