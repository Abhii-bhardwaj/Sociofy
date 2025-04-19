import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import emitter from "../lib/eventEmitter"; // path as per your structure


export const useSettingsStore = create(
  persist(
    (set) => ({
      selectedSetting: "Account",
      setSelectedSetting: (setting) => set({ selectedSetting: setting }),

      userInfo: null,
      setUserInfo: (userData) => {
        set({ userInfo: userData });
        emitter.emit("USER_UPDATED", userData); // Emit event
      },

      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      appearanceSettings: {
        colorContrast: "normal",
        fontSize: "medium",
        language: "en",
      },
      updateAppearanceSettings: async (settings) => {
        try {
          // Optionally save to backend
          const response = await axiosInstance.put(
            "/user/update-appearance",
            { appearanceSettings: settings },
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            }
          );
          if (response.status === 200) {
            set({ appearanceSettings: settings });
            emitter.emit("APPEARANCE_UPDATED", settings);
            return response.data;
          }
        } catch (error) {
          const errorMsg =
            error.response?.data?.message ||
            "Failed to update appearance settings";
          toast.error(errorMsg);
          throw error;
        }
      },
      accountSettings: {
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      },
      updateAccountSettings: (key, value) => {
        console.log(`Updating accountSettings: ${key} = ${value}`);
        set((state) => ({
          accountSettings: {
            ...state.accountSettings,
            [key]: value,
          },
        }));
      },
      clearAccountSettings: () =>
        set({
          accountSettings: {
            currentPassword: "",
            newPassword: "",
            confirmNewPassword: "",
          },
        }),

      updateProfilePicture: async (file) => {
        if (!file) return;

        const formData = new FormData();
        formData.append("profilePicture", file);

        try {
          const response = await axiosInstance.put(
            "/user/update-profile-picture",
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            }
          );

          if (response.status === 200) {
            return response.data; // { success: true, profilePicture: "url" }
          }
        } catch (error) {
          console.error("Failed to update profile picture:", error);
          throw error;
        }
      },

      updateUserProfile: async (data) => {
        try {
          const response = await axiosInstance.put(
            "/user/update-profile",
            data,
            {
              headers: { "Content-Type": "application/json" },
              withCredentials: true,
            }
          );
          if (response.status === 200) {
            return response.data; // { message: "Profile updated successfully", user: {...} }
          }
        } catch (error) {
          const errorMsg =
            error.response?.data?.message || "Failed to update profile";
          toast.error(errorMsg);
          throw error;
        }
      },

      syncUserData: (user) => set({ userInfo: user }), // Sync function
    }),

    {
      name: "settings-store",
      getStorage: () => localStorage,
      partialize: (state) => ({
        selectedSetting: state.selectedSetting,
        userInfo: state.userInfo,
        darkMode: state.darkMode,
        appearanceSettings: state.appearanceSettings,
        // Exclude accountSettings for security
      }),
    }
  )
);

// export const loadUserInfo = async () => {
//   const { setUserInfo, setLoading } = useSettingsStore.getState();
//   setLoading(true);

//   const userData = await fetchUserData();
//   if (userData) {
//     setUserInfo(userData);
//   } else {
//     console.log("No user data fetched");
//   }
//   setLoading(false);
// };

export const useInitializeSettings = () => {
  useEffect(() => {
    emitter.on("USER_UPDATED", (user) => {
      if (user) useSettingsStore.getState().syncUserData(user);
    });
    emitter.on("APPEARANCE_UPDATED", (settings) => {
      if (settings)
        useSettingsStore.getState().updateAppearanceSettings(settings);
    });
  }, []);
};
