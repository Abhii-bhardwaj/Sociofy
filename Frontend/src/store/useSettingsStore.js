import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import { useEffect } from "react";
import toast from "react-hot-toast";
import  mitt  from "mitt";

const emitter = mitt();

const fetchUserData = async () => {
  try {
    const response = await axiosInstance.get(`/auth/check`, {
      withCredentials: true,
    });
    if (response.status !== 200) throw new Error("Failed to fetch user data");
    return response.data;
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
};

export const useSettingsStore = create(
  persist(
    (set) => ({
      selectedSetting: "Account",
      setSelectedSetting: (setting) => set({ selectedSetting: setting }),

      userInfo: null,
      setUserInfo: (userData) => {
        set({ userInfo: userData });
        emitter.emit("USER_UPDATED", userData);
      },

      isLoading: false,
      setLoading: (loading) => set({ isLoading: loading }),

      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

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
            set((state) => ({
              userInfo: {
                ...state.userInfo,
                profilePic: response.data.profilePicture,
              },
            }));
            toast.success("Profile picture updated!");
            emitter.emit("USER_UPDATED", response.data.user);
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
            data
          );
          if (response.status === 200) {
            set((state) => ({
              userInfo: {
                ...state.userInfo,
                ...response.data.user,
              },
            }));
            toast.success("Profile updated successfully!");
            emitter.emit("USER_UPDATED", response.data.user);
            return response.data;
          }
        } catch (error) {
          const errorMsg =
            error.response?.data?.message || "Failed to update profile";
          toast.error(errorMsg);
          throw error;
        }
      },
    }),
    {
      name: "settings-store",
      getStorage: () => localStorage,
    }
  )
);

export const loadUserInfo = async () => {
  const { setUserInfo, setLoading } = useSettingsStore.getState();
  setLoading(true);

  const userData = await fetchUserData();
  if (userData) {
    setUserInfo(userData);
  } else {
    console.log("No user data fetched");
  }
  setLoading(false);
};

export const useInitializeSettings = () => {
  useEffect(() => {
    emitter.on("USER_UPDATED", (user) => {
      if (user) useSettingsStore.getState().setUserInfo(user);
    });
  }, []);
};
