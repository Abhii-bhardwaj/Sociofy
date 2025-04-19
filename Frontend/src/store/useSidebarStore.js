import { create } from "zustand";
import mitt from "mitt";
import { useEffect } from "react";

const emitter = mitt();

const useSidebarStore = create((set) => ({
  isOpen: false,
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
  closeSidebar: () => set({ isOpen: false }),

  userData: null,
  setUserData: (data) => set({ userData: data }),

  profileData: null,
  setProfileData: (data) => set({ profileData: data }),

  syncUserData: (user) => set({ userData: user }), // Sync function
}));

export const useSyncSidebar = () => {
  useEffect(() => {
    emitter.on("USER_UPDATED", (user) => {
      useSidebarStore.getState().syncUserData(user); // Sync user data
    });

    emitter.on("PROFILE_UPDATED", (profileUser) => {
      useSidebarStore.getState().setProfileData(profileUser);
    });

    emitter.on("PROFILE_CLEARED", () => {
      useSidebarStore.getState().setProfileData(null);
    });

    return () => {
      emitter.all.clear();
    };
  }, []);
};

export { emitter };
export default useSidebarStore;
