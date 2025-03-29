import { FaSearch } from "react-icons/fa";
import {useSettingsStore} from "../../store/useSettingsStore";
import AccountSettings from "./SpecificPages/AccountSettings";
import EditProfile from "./SpecificPages/EditProfile";

const MainComponent = () => {
  const { selectedSetting } = useSettingsStore();

  return (
    <div className="h-screen overflow-y-auto w-full p-4 md:p-8 bg-base-100">
      {/* ✅ Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div className="text-lg font-bold"></div>
        <div className="relative flex items-center justify-around w-full md:w-auto">
          <input
            type="text"
            placeholder="Search Settings"
            className=" text-base-content input-bordered input p-2 rounded-md w-48 md:w-64 pl-10" // Add padding-left to make space for the icon
          />
          <FaSearch className="absolute right-2 text-base-content/60 text-xl" />{" "}
          {/* Position the icon inside the input */}
        </div>
      </div>
      {/* ✅ Dynamic Content Based on Selected Setting */}
      {selectedSetting === "Account" && <AccountSettings />}
      {selectedSetting === "Edit Profile" && <EditProfile />}
      {selectedSetting === "Saved" && <p>Saved Items Settings</p>}
      {selectedSetting === "Notifications" && <p>Notification Preferences</p>}
      {selectedSetting === "Color Contrast" && <p>Color Contrast Settings</p>}
      {selectedSetting === "Font Size" && <p>Font Size Settings</p>}
      {selectedSetting === "Language" && <p>Language Settings</p>}
      {selectedSetting === "Theme" && <p>Theme Settings</p>}
      {selectedSetting === "Help" && <p>Help & Support</p>}
      {selectedSetting === "Feedback" && <p>Feedback Section</p>}
      {selectedSetting === "Contact Us" && <p>Contact Us Section</p>}
    </div>
  );
};

export default MainComponent;
