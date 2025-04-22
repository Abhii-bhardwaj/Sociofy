import React, { useEffect, useRef, useState } from "react";
import { useCreatePostStore } from "../store/useCreatePostStore.js";
import { useAuthStore } from "../store/useAuthStore";
import { usePostStore } from "../store/usePostStore.js";
import { axiosInstance } from "../lib/axios";
import { useNavigate } from "react-router-dom";
import { Camera, X } from "lucide-react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import toast from "react-hot-toast";

const CreatePost = ({ isOpen, onClose, postToEdit = null }) => {
  const { images, addImage, removeImage, caption, setCaption, resetState } =
    useCreatePostStore();
  const { authUser } = useAuthStore();
  const { editPost, fetchPosts } = usePostStore();
  const navigate = useNavigate();
  const dropZoneRef = useRef(null);
  const sliderRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!postToEdit;

  useEffect(() => {
    if (isEditMode) {
      setCaption(postToEdit.caption || "");
      postToEdit.postImage.forEach((img) => addImage({ url: img.url }));
    }
  }, [isEditMode, postToEdit]);

  const handleClose = () => {
    resetState();
    onClose();
  };

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter(
      (file) =>
        file instanceof File &&
        file.size > 0 &&
        ["image/jpeg", "image/png", "image/jpg"].includes(file.type)
    );
    if (validFiles.length === 0) {
      toast.error("No valid image files selected!");
      return;
    }
    const selectedFiles = validFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));
    selectedFiles.forEach((fileObj) => addImage(fileObj));
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFiles(event.target.files);
      event.target.value = null;
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    dropZoneRef.current?.classList.add(
      "border-primary",
      "hover:border-primary"
    );
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    dropZoneRef.current?.classList.remove(
      "border-primary",
      "hover:border-primary"
    );
  };

  const handleDrop = (event) => {
    event.preventDefault();
    dropZoneRef.current?.classList.remove(
      "border-primary",
      "hover:border-primary"
    );
    handleFiles(event.dataTransfer.files);
  };

  const removeFile = (index, e) => {
    if (e) e.stopPropagation();
    removeImage(index);
  };

  const handleDropZoneClick = () => {
    fileInputRef.current?.click();
  };

  const handlePostSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    console.log("handlePostSubmit called");
    console.log("Current caption state:", caption);
    if (!authUser) return toast.error("Please login to create a post!");
    if (images.length === 0 && !caption)
      return toast.error("Please add an image or caption!");

    const formData = new FormData();
    images.forEach((imageObj, index) => {
      if (imageObj.file) formData.append("postImages", imageObj.file);
    });
    formData.append("caption", caption || "");
    console.log("FormData caption:", formData.get("caption"));

    for (let [key, value] of formData.entries()) {
      console.log(`${key}: ${value}`);
    }

    try {
      if (isEditMode) {
        console.log("Editing Post ID:", postToEdit._id);
        const response = await axiosInstance.put(
          `/post/${postToEdit._id}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
        console.log("Edit API Response:", response.data);
        await editPost(postToEdit._id, response.data.post);
        await fetchPosts();
        toast.success("Post updated successfully!");
      } else {
        const response = await axiosInstance.post(
          `/user/${authUser._id}/create-post`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            withCredentials: true,
          }
        );
        if (response.status === 201) {
          console.log("New post created:", response.data.post);
          await fetchPosts();
          toast.success("Post created successfully!");
        }
      }
      resetState();
      onClose();
      navigate("/");
    } catch (error) {
      console.error("Error:", error.message, error.response?.data);
      toast.error(error.response?.data?.message || "Failed to process post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    adaptiveHeight: true,
  };

  return (
    <div
      className={`fixed top-0 bottom-0 left-0 right-0  mb-14 flex items-center justify-center bg-base-100/50 backdrop-blur-md z-50 p-0 sm:p-6 transition-opacity ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}>
      <div className="bg-base-200 bg-opacity-90 rounded-none  sm:rounded-xl shadow-xl p-3 sm:p-6 w-full h-[calc(100vh-170px)] sm:w-full sm:max-w-md md:max-w-lg sm:h-full border border-base-300 transition-all duration-300 scale-100">
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            className="btn btn-circle btn-ghost btn-sm text-base-content">
            <X size={20} />
          </button>
        </div>

        <h1 className="text-xl sm:text-2xl font-semibold text-center text-base-content mb-4 sm:mb-6">
          {isEditMode ? "Edit Post" : "Create Post"}
        </h1>

        <div
          ref={dropZoneRef}
          className="relative border-dashed border-2 border-base-300 hover:border-primary rounded-lg h-48 sm:h-64 mb-4 sm:mb-6 flex items-center justify-center text-base-content text-sm sm:text-base overflow-hidden"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleDropZoneClick}>
          {images.length === 0 ? (
            <>
              <Camera
                size={80}
                className="absolute opacity-20 text-base-content"
              />
              <p className="text-base-content mt-30 z-10">
                Drag & Drop or Click to Upload
              </p>
            </>
          ) : (
            <div className="w-full h-full">
              <Slider
                ref={sliderRef}
                {...sliderSettings}
                className="w-full h-full">
                {images.map((imageObj, index) => (
                  <div
                    key={`slide-${index}-${imageObj.url}`}
                    className="relative w-full h-48 sm:h-64 flex justify-center items-center">
                    <img
                      src={imageObj.url}
                      alt={`Uploaded ${index}`}
                      className="max-w-full max-h-full object-cover rounded-lg"
                    />
                    <button
                      className="absolute top-2 right-2 btn btn-error btn-sm rounded-full p-1 z-10"
                      onClick={(e) => removeFile(index, e)}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </Slider>
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            multiple
            onChange={handleFileChange}
          />
        </div>

        <textarea
          placeholder="What's on your mind?"
          value={caption || ""}
          onChange={(e) => {
            setCaption(e.target.value);
            console.log("Caption changed to:", e.target.value);
          }}
          className="w-full h-14 sm:h-20 px-2 sm:px-3 bg-transparent resize-none text-base-content border-b border-base-300 py-2 mb-4 sm:mb-6 focus:outline-none placeholder:text-base-content/50 focus:border-primary transition-all duration-300 textarea textarea-bordered"
        />

        <div className="flex justify-center flex-wrap gap-2">
          <button
            onClick={handlePostSubmit}
            className="btn btn-primary w-full sm:w-auto px-4 sm:px-6"
            disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : isEditMode ? "Update" : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
