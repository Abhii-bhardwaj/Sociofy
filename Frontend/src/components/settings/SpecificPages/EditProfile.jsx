import { useState, useEffect } from "react";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useAuthStore } from "../../../store/useAuthStore";
import { toast } from "react-hot-toast";
import { FaCheck } from "react-icons/fa";

const EditProfile = () => {
  const { updateProfilePicture, updateUserProfile, isLoading, setUserInfo } =
    useSettingsStore();
  const { authUser, setAuthUser } = useAuthStore();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [confirmedFormData, setConfirmedFormData] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(
    authUser?.profilePic || "/placeholder.jpeg"
  );
  const [confirmedProfilePic, setConfirmedProfilePic] = useState(
    authUser?.profilePic || "/placeholder.jpeg"
  );

  useEffect(() => {
    console.log("Auth User in EditProfile:", authUser);
    const sourceUser = authUser;
    if (sourceUser) {
      const userData = {
        username: sourceUser.username || "",
        email: sourceUser.email || "",
        bio: sourceUser.bio || "",
      };
      setFormData(userData);
      setConfirmedFormData(userData);
      setPreviewImage(sourceUser.profilePic || "/placeholder.jpeg");
      setConfirmedProfilePic(sourceUser.profilePic || "/placeholder.jpeg");
    }
  }, [authUser]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    } else {
      toast.error("No file selected!");
    }
  };

  const handleProfilePicUpdate = async () => {
    if (!selectedFile) {
      toast.error("No image selected!");
      return;
    }
    try {
      const response = await updateProfilePicture(selectedFile);
      const newProfilePic = response.profilePicture;

      // Update store states
      setUserInfo({ ...authUser, profilePic: newProfilePic });
      setAuthUser({ ...authUser, profilePic: newProfilePic });

      // Update local states
      setConfirmedProfilePic(newProfilePic);
      setSelectedFile(null);
      setPreviewImage(newProfilePic);
      toast.success("Profile picture updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile picture!");
      console.error("Error updating profile picture:", error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const response = await updateUserProfile(formData);
      const updatedUser = response.user;

      // Update store states
      setUserInfo(updatedUser);
      setAuthUser(updatedUser);

      // Update local state
      setConfirmedFormData({
        username: updatedUser.username || formData.username,
        email: updatedUser.email || formData.email,
        bio: updatedUser.bio || formData.bio,
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile!");
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    setFormData(confirmedFormData);
    setSelectedFile(null);
    setPreviewImage(confirmedProfilePic);
  };

  return (
    <div className="p-4 sm:p-6 w-full max-w-md sm:max-w-lg mx-auto bg-base-100 rounded-lg">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-base-content">
        Profile Settings
      </h2>

      <div className="flex flex-col sm:flex-row items-center mb-6 sm:mb-8 relative">
        <div className="relative">
          <img
            alt="Profile"
            className="rounded-full border-2 border-base-300 object-cover w-12 h-12 sm:w-16 sm:h-16"
            src={confirmedProfilePic}
            onError={(e) => (e.target.src = "/placeholder.jpeg")}
          />
          <label
            htmlFor="profilePicInput"
            className="absolute inset-0 flex items-center justify-center bg-base-content bg-opacity-50 rounded-full opacity-0 hover:opacity-60 transition-opacity cursor-pointer">
            <span className="text-base-content text-xs sm:text-sm">Change</span>
          </label>
          <input
            id="profilePicInput"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {selectedFile && (
            <button
              className="absolute -top-2 -right-2 btn btn-xs sm: disorder btn-success rounded-full p-1"
              onClick={handleProfilePicUpdate}
              disabled={isLoading}>
              <FaCheck className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          )}
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-4 text-center sm:text-left">
          <h3 className="text-base sm:text-lg font-semibold text-base-content">
            {confirmedFormData.username || "Loading..."}
          </h3>
          <p className="text-base-content/60 text-sm sm:text-base">
            {confirmedFormData.email || "Loading..."}
          </p>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <label className="block text-base-content/80 text-sm sm:text-base mb-2">
          Username
        </label>
        <input
          type="text"
          name="username"
          className="input input-bordered w-full text-sm sm:text-base"
          value={formData.username}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4 sm:mb-6">
        <label className="block text-base-content/60 text-sm sm:text-base mb-2">
          Email
        </label>
        <input
          type="email"
          name="email"
          className="input input-bordered w-full text-sm sm:text-base"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4 sm:mb-6">
        <label className="block text-base-content/60 text-sm sm:text-base mb-2">
          Bio
        </label>
        <textarea
          name="bio"
          className="textarea textarea-bordered w-full resize-none text-sm sm:text-base"
          rows="3"
          placeholder="Tell something about yourself..."
          value={formData.bio}
          onChange={handleChange}
        />
      </div>

      {confirmedFormData.bio && (
        <div className="mb-4 sm:mb-6">
          <p className="text-base-content/60 font-semibold text-sm sm:text-base">
            Your Bio:
          </p>
          <p className="text-base-content/80 text-sm sm:text-base">
            {confirmedFormData.bio}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-2 sm:space-x-3">
        <button
          className="btn btn-neutral btn-sm sm:btn-md"
          onClick={handleCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary btn-sm sm:btn-md"
          onClick={handleSaveChanges}
          disabled={isLoading}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
