import { useState, useEffect } from "react";
import {useSettingsStore,loadUserInfo} from "../../../store/useSettingsStore";
import { toast } from "react-hot-toast";

const AccountSettings = () => {
  const [openSection, setOpenSection] = useState(null);
  const { userInfo, setUserInfo, accountSettings, updateAccountSettings } =
    useSettingsStore();

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handlePasswordChange = () => {
    if (accountSettings.newPassword !== accountSettings.confirmNewPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }
    toast.success("Password changed successfully!");
    updateAccountSettings("currentPassword", accountSettings.newPassword);
  };

  const handleAccountAction = (action) => {
    if (window.confirm(`Are you sure you want to ${action} your account?`)) {
      toast.success(`Account ${action}d successfully!`);
    }
    };
    
    useEffect(() => {
      loadUserInfo(); // ✅ Load user info when component mounts
    }, []);

  return (
    <div className="p-4 w-full bg-base-100">
      <h2 className="text-2xl font-bold mb-4 text-base-content">
        Account Settings
      </h2>

      <div className="flex flex-col justify-center items-center">
        {/* Personal Information Section */}
        <div className="mb-4 border-b bg-base-100 border-base-300 pb-2">
          <button
            className="w-96 text-left text-lg font-semibold p-2 btn btn-neutral bg-base-200 text-base-content rounded"
            onClick={() => toggleSection("personal")}>
            Personal Information
          </button>
          {openSection === "personal" && (
            <div className="w-96 p-4 bg-base-200 text-base-content rounded mt-2">
              <p>
                <strong>Name:</strong>{" "}
                {userInfo ? userInfo.fullName : "Loading..."}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {userInfo ? userInfo.email : "Loading..."}
              </p>
              <p>
                <strong>Username:</strong> {userInfo.username}
              </p>
            </div>
          )}
        </div>

        {/* Password & Security Section */}
        <div className="mb-4 border-b border-base-300 pb-2">
          <button
            className="w-96 text-left text-lg font-semibold p-2 btn btn-neutral bg-base-200 text-base-content rounded"
            onClick={() => toggleSection("security")}>
            Password & Security
          </button>
          {openSection === "security" && (
            <div className="w-96 p-4 bg-base-200 text-base-content rounded mt-2">
              <input
                type="password"
                placeholder="Current Password"
                className="input input-bordered w-80 mb-2"
                onChange={(e) =>
                  updateAccountSettings("currentPassword", e.target.value)
                }
              />
              <input
                type="password"
                placeholder="New Password"
                className="input input-bordered w-80 mb-2"
                onChange={(e) =>
                  updateAccountSettings("newPassword", e.target.value)
                }
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="input input-bordered w-80 mb-2"
                onChange={(e) =>
                  updateAccountSettings("confirmNewPassword", e.target.value)
                }
              />
              <button
                className="btn btn-primary"
                onClick={handlePasswordChange}>
                Change Password
              </button>
            </div>
          )}
        </div>

        {/* Account Management Section */}
        <div className="mb-4 border-b border-base-200 pb-2">
          <button
            className="w-96 text-left text-lg font-semibold p-2 btn btn-neutral bg-base-100 text-base-content rounded"
            onClick={() => toggleSection("management")}>
            Account Management
          </button>
          {openSection === "management" && (
            <div className="w-96 p-4 bg-base-200 flex text-base-content rounded mt-2">
              <button
                className="btn btn-warning mr-2"
                onClick={() => handleAccountAction("deactivate")}>
                Deactivate Account
              </button>
              <button
                className="btn btn-error"
                onClick={() => handleAccountAction("delete")}>
                Permanently Delete Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountSettings;
