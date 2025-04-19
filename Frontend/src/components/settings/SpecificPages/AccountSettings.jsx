import { useState, useEffect } from "react";
import {
  useSettingsStore,
} from "../../../store/useSettingsStore";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../../../lib/axios";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";

const AccountSettings = () => {
  const [openSection, setOpenSection] = useState(null);
  const {
    accountSettings = {
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
    },
    updateAccountSettings,
    clearAccountSettings,
  } = useSettingsStore();
  const { authUser } = useAuthStore(); // Get authUser for debugging
  const navigate = useNavigate();

  const toggleSection = (section) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handlePasswordChange = async () => {
    if (accountSettings.newPassword !== accountSettings.confirmNewPassword) {
      toast.error("New password and confirm password do not match!");
      return;
    }
    try {
      await axiosInstance.put(
        "/user/change-password",
        {
          currentPassword: accountSettings.currentPassword,
          newPassword: accountSettings.newPassword,
          confirmNewPassword: accountSettings.confirmNewPassword,
        },
        { withCredentials: true }
      );
      toast.success("Password changed successfully!");
      clearAccountSettings(); // Clear form fields
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to change password!"
      );
      console.error("Error changing password:", error);
    }
  };

  const handleAccountAction = async (action) => {
    if (action !== "delete" && action !== "deactivate") return;
    const message =
      action === "delete"
        ? "Are you sure you want to delete your account? This cannot be undone."
        : "Are you sure you want to deactivate your account?";
    if (window.confirm(message)) {
      try {
        if (action === "delete") {
          await axiosInstance.delete("/user/delete-account", {
            withCredentials: true,
          });
          toast.success("Account deleted successfully!");
          await useAuthStore.getState().logout();
          navigate("/login");
        } else {
          // Placeholder for deactivate logic
          toast.success("Account deactivated successfully!");
        }
      } catch (error) {
        toast.error(
          error.response?.data?.message || `Failed to ${action} account!`
        );
        console.error(`Error ${action} account:`, error);
      }
    }
  };

  useEffect(() => {
    authUser; // Load user info when component mounts
    console.log("accountSettings:", accountSettings); // Debug
  }, [accountSettings]);

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
                {authUser ? authUser.fullName : "Loading..."}
              </p>
              <p>
                <strong>Email:</strong>{" "}
                {authUser ? authUser.email : "Loading..."}
              </p>
              <p>
                <strong>Username:</strong> {authUser?.username || "Loading..."}
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
                value={accountSettings.currentPassword || ""}
                onChange={(e) =>
                  updateAccountSettings("currentPassword", e.target.value)
                }
              />
              <input
                type="password"
                placeholder="New Password"
                className="input input-bordered w-80 mb-2"
                value={accountSettings.newPassword || ""}
                onChange={(e) =>
                  updateAccountSettings("newPassword", e.target.value)
                }
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                className="input input-bordered w-80 mb-2"
                value={accountSettings.confirmNewPassword || ""}
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
