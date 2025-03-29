// store/useCreatePostStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useCreatePostStore = create(
  persist(
    (set) => ({
      images: [],
      caption: "", // ✅ Default empty string
      setCaption: (caption) => set({ caption }),
      addImage: (image) =>
        set((state) => ({ images: [...state.images, image] })),
      removeImage: (index) =>
        set((state) => {
          const newImages = [...state.images];
          newImages.splice(index, 1);
          return { images: newImages };
        }),
      clearImages: () => set({ images: [] }),
      resetState: () => set({ images: [], caption: "" }), // ✅ Reset to empty string
    }),
    { name: "create-post-storage" }
  )
);
