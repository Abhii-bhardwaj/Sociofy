import { useState, useEffect } from "react";
import { IoMdMenu } from "react-icons/io";
import { SunMoon } from "lucide-react";
import Sidebar from "../components/settings/Sidebar";
import MainComponent from "../components/settings/MainComponent.jsx";
import { useSettingsStore } from "../store/useSettingsStore";

function SettingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { darkMode, toggleDarkMode, appearanceSettings } = useSettingsStore();
  const [selectedSection, setSelectedSection] = useState("Account");

  // useEffect(() => {
  //   loadUserInfo();
  // }, []);

  // Dynamic classes based on appearance settings
  const fontSizeClass =
    {
      small: "text-sm",
      medium: "text-base",
      large: "text-lg",
    }[appearanceSettings.fontSize] || "text-base";

  const contrastClass =
    {
      normal: "",
      high: "contrast-150",
      low: "contrast-75",
    }[appearanceSettings.colorContrast] || "";

  return (
    <div
      className={`flex h-screen font-roboto bg-base-100 ${fontSizeClass} ${contrastClass} ${
        darkMode ? "dark" : ""
      }`}>
      <div
        className={`fixed inset-y-0 left-0 transform transition-transform duration-300 ease-in-out z-40 w-64 border-r-2 border-base-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}>
        <Sidebar
          closeSidebar={() => setSidebarOpen(false)}
          setSelectedSection={setSelectedSection}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 md:hidden"
          onClick={() => setSidebarOpen(false)}></div>
      )}

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <button
            className="md:hidden btn btn-ghost p-2"
            onClick={() => setSidebarOpen(true)}>
            <IoMdMenu className="text-2xl text-base-content" />
          </button>

          <h1 className="text-2xl font-bold flex-1 text-center text-base-content">
            Settings
          </h1>

          <button className="btn btn-primary p-2" onClick={toggleDarkMode}>
            <SunMoon />
          </button>
        </div>

        <MainComponent selectedSection={selectedSection} />
      </div>
    </div>
  );
}

export default SettingsPage;
