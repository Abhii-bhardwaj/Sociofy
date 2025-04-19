import { useState } from "react";
import { useSettingsStore } from "../../../store/useSettingsStore";
import { toast } from "react-hot-toast";
import { FaRegEdit } from "react-icons/fa";

const PostSettings = () => {
  const { userInfo, updateUserProfile } = useSettingsStore();
  const [postSettings, setPostSettings] = useState({
    visibility: userInfo?.postSettings?.visibility || "public",
    comments: userInfo?.postSettings?.comments || "everyone",
    tagging: userInfo?.postSettings?.tagging || "everyone",
  });

  const handleChange = (e) => {
    setPostSettings({ ...postSettings, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
      await updateUserProfile({ postSettings });
      toast.success("Post settings updated successfully!");
    } catch (error) {
      toast.error("Failed to update post settings!");
      console.error("Error updating post settings:", error);
    }
  };

  return (
    <div className="p-4 w-full bg-base-100">
      <h2 className="text-2xl font-bold mb-4 text-base-content">
        Post Settings
      </h2>
      <div className="space-y-6">
        {/* Post Visibility */}
        <div className="mb-4">
          <label className="block text-base-content/80 mb-2">
            Who can see your posts?
          </label>
          <select
            name="visibility"
            className="select select-bordered w-full max-w-xs"
            value={postSettings.visibility}
            onChange={handleChange}>
            <option value="public">Public</option>
            <option value="friends">Friends</option>
            <option value="private">Only Me</option>
          </select>
        </div>

        {/* Comment Settings */}
        <div className="mb-4">
          <label className="block text-base-content/80 mb-2">
            Who can comment on your posts?
          </label>
          <select
            name="comments"
            className="select select-bordered w-full max-w-xs"
            value={postSettings.comments}
            onChange={handleChange}>
            <option value="everyone">Everyone</option>
            <option value="friends">Friends</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>

        {/* Tagging Settings */}
        <div className="mb-4">
          <label className="block text-base-content/80 mb-2">
            Who can tag you in posts?
          </label>
          <select
            name="tagging"
            className="select select-bordered w-full max-w-xs"
            value={postSettings.tagging}
            onChange={handleChange}>
            <option value="everyone">Everyone</option>
            <option value="friends">Friends</option>
            <option value="nobody">Nobody</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button className="btn btn-neutral mr-2">Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>
            <FaRegEdit className="mr-1" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostSettings;
