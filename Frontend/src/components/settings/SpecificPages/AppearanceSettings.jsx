import { useState, useEffect } from "react";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";
import { FaAdjust, FaTextHeight, FaLanguage, FaMoon } from "react-icons/fa";

const AppearanceSettings = () => {
  const { t } = useTranslation();
  const {
    selectedSetting,
    darkMode,
    toggleDarkMode,
    updateAppearanceSettings,
    appearanceSettings,
  } = useSettingsStore();

  const [localSettings, setLocalSettings] = useState({
    colorContrast: appearanceSettings.colorContrast || "normal",
    fontSize: appearanceSettings.fontSize || "medium",
    language: appearanceSettings.language || "en",
  });

  useEffect(() => {
    setLocalSettings({
      colorContrast: appearanceSettings.colorContrast || "normal",
      fontSize: appearanceSettings.fontSize || "medium",
      language: appearanceSettings.language || "en",
    });
  }, [appearanceSettings]);

  useEffect(() => {
    console.log("Selected Setting:", selectedSetting);
    console.log("Local Settings:", localSettings);
  }, [selectedSetting, localSettings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Changing ${name} to ${value}`);
    setLocalSettings((prev) => {
      const newSettings = { ...prev, [name]: value };
      return newSettings;
    });
  };

  const handleSave = async () => {
    try {
      await updateAppearanceSettings(localSettings);
      toast.success(t("Save Changes"));
    } catch (error) {
      toast.error(t("Failed to update appearance settings!"));
      console.error("Error updating appearance settings:", error);
    }
  };

  const renderSection = () => {
    if (!selectedSetting) {
      console.warn("No selected setting, rendering default message");
      return (
        <div className="text-base-content/60">
          {t("Select an appearance setting from the sidebar.")}
        </div>
      );
    }

    switch (selectedSetting) {
      case "Color Contrast":
        return (
          <div className="mb-4">
            <label className="block text-base-content/80 mb-2">
              {t("Color Contrast")}
            </label>
            <select
              name="colorContrast"
              className="select select-bordered w-full max-w-xs focus:outline-none"
              value={localSettings.colorContrast}
              onChange={handleChange}>
              <option value="normal">{t("Normal")}</option>
              <option value="high">{t("High Contrast")}</option>
              <option value="low">{t("Low Contrast")}</option>
            </select>
          </div>
        );
      case "Font Size":
        return (
          <div className="mb-4">
            <label className="block text-base-content/80 mb-2">
              {t("Font Size")}
            </label>
            <select
              name="fontSize"
              className="select select-bordered w-full max-w-xs focus:outline-none"
              value={localSettings.fontSize}
              onChange={handleChange}>
              <option value="small">{t("Small")}</option>
              <option value="medium">{t("Medium")}</option>
              <option value="large">{t("Large")}</option>
            </select>
          </div>
        );
      case "Language":
        return (
          <div className="mb-4">
            <label className="block text-base-content/80 mb-2">
              {t("Language")}
            </label>
            <select
              name="language"
              className="select select-bordered w-full max-w-xs focus:outline-none"
              value={localSettings.language}
              onChange={handleChange}>
              <option value="en">{t("English")}</option>
              <option value="es">{t("Spanish")}</option>
              <option value="fr">{t("French")}</option>
            </select>
          </div>
        );
      case "Theme":
        return (
          <div className="mb-4">
            <label className="block text-base-content/80 mb-2">
              {t("Theme")}
            </label>
            <button
              className="btn btn-primary"
              onClick={() => {
                console.log("Toggling dark mode, current:", darkMode);
                toggleDarkMode();
              }}>
              <FaMoon className="mr-1" />
              {darkMode ? t("Switch to Light") : t("Switch to Dark")}
            </button>
          </div>
        );
      default:
        console.warn("Unknown selected setting:", selectedSetting);
        return (
          <div className="text-base-content/60">
            {t("Select an appearance setting from the sidebar.")}
          </div>
        );
    }
  };

  return (
    <div className="p-4 w-full bg-base-100">
      <h2 className="text-2xl font-bold mb-4 text-base-content">
        {t("Appearance Settings")}
      </h2>
      <div className="space-y-6">
        {renderSection()}
        {selectedSetting !== "Theme" && selectedSetting && (
          <div className="flex justify-end">
            <button className="btn btn-neutral mr-2">{t("Cancel")}</button>
            <button className="btn btn-primary" onClick={handleSave}>
              {t("Save Changes")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppearanceSettings;
