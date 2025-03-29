import { useState, useEffect } from "react";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { useAuthStore } from "../../../store/useAuthStore"; // Import useAuthStore
import { toast } from "react-hot-toast";

const DEFAULT_PROFILE_PIC = "https://via.placeholder.com/48"; // Use a valid placeholder

const EditProfile = () => {
  const { userInfo, updateProfilePicture, updateUserProfile, isLoading } =
    useSettingsStore();
  const { user } = useAuthStore(); // Get authUser for debugging
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    bio: "",
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(userInfo?.profilePic);

  useEffect(() => {
    console.log("Auth User in EditProfile:", user); // Debug
    if (userInfo) {
      setFormData({
        username: userInfo.username || "",
        email: userInfo.email || "",
        bio: userInfo.bio || "",
      });
      setPreviewImage(userInfo.profilePic || DEFAULT_PROFILE_PIC);
    }
  }, [userInfo]);

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

  const handleSaveChanges = async () => {
    try {
      // Update profile data
      await updateUserProfile(formData);

      // Update profile picture if selected
      if (selectedFile) {
        await updateProfilePicture(selectedFile);
      }

      // Force refresh authUser data
      const { checkAuth } = useAuthStore.getState();
      await checkAuth();

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile!");
      console.error(error);
    }
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
            src={previewImage || DEFAULT_PROFILE_PIC}
            onError={(e) => (e.target.src = DEFAULT_PROFILE_PIC)}
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
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-base-content">
            {formData.username || "Loading..."}
          </h3>
          <p className="text-base-content/60">
            {formData.email || "Loading..."}
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

      {formData.bio && (
        <div className="mb-4">
          <p className="text-base-content/60 font-semibold">Your Bio:</p>
          <p className="text-base-content/80">{formData.bio}</p>
        </div>
      )}

      <div className="flex justify-end">
        <button className="btn btn-neutral mr-2">Cancel</button>
        <button className="btn btn-primary" onClick={handleSaveChanges}>
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfile;
