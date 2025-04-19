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
    <div className="p-4 w-full bg-base-100">
      <h2 className="text-2xl font-bold mb-4 text-base-content">
        Profile Settings
      </h2>

      <div className="flex items-center mb-6 relative">
        <div className="relative">
          <img
            alt="Profile"
            className="rounded-full w-20 h-20 border-2 border-base-300 object-cover"
            src={confirmedProfilePic}
            onError={(e) => (e.target.src = "/placeholder.jpeg")}
          />
          <label
            htmlFor="profilePicInput"
            className="absolute inset-0 flex items-center justify-center bg-base-content bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
            <span className="text-base-content text-sm">Change</span>
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
              className="absolute -top-2 -right-2 btn btn-sm btn-success rounded-full p-1"
              onClick={handleProfilePicUpdate}
              disabled={isLoading}>
              <FaCheck />
            </button>
          )}
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-base-content">
            {confirmedFormData.username || "Loading..."}
          </h3>
          <p className="text-base-content/60">
            {confirmedFormData.email || "Loading..."}
          </p>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-base-content/80">Username</label>
        <input
          type="text"
          name="username"
          className="input input-bordered w-full"
          value={formData.username}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="block text-base-content/60">Email</label>
        <input
          type="email"
          name="email"
          className="input input-bordered w-full"
          value={formData.email}
          onChange={handleChange}
        />
      </div>

      <div className="mb-4">
        <label className="block text-base-content/60">Bio</label>
        <textarea
          name="bio"
          className="textarea textarea-bordered w-full resize-none"
          rows="3"
          placeholder="Tell something about yourself..."
          value={formData.bio}
          onChange={handleChange}
        />
      </div>

      {confirmedFormData.bio && (
        <div className="mb-4">
          <p className="text-base-content/60 font-semibold">Your Bio:</p>
          <p className="text-base-content/80">{confirmedFormData.bio}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn btn-neutral mr-2" onClick={handleCancel}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSaveChanges}
          disabled={isLoading}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
