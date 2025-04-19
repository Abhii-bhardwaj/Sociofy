import { useState, useEffect } from "react";
import { axiosInstance } from "../../lib/axios";
import {
  Settings,
  Save,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Globe,
  Shield,
  Bell,
  FileText,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [generalSettings, setGeneralSettings] = useState({});
  const [securitySettings, setSecuritySettings] = useState({});
  const [notificationSettings, setNotificationSettings] = useState({});
  const [contentSettings, setContentSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await axiosInstance.get("/admin/settings");

      if (response.data && typeof response.data === "object") {
        const { general, security, notifications, content } = response.data;
        setGeneralSettings(general || {});
        setSecuritySettings(security || {});
        setNotificationSettings(notifications || {});
        setContentSettings(content || {});
      } else {
        throw new Error("Invalid settings data format");
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      setError("Failed to load settings. Please try again.");
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);

      const allSettings = {
        general: generalSettings,
        security: securitySettings,
        notifications: notificationSettings,
        content: contentSettings,
      };

      await axiosInstance.put("/admin/settings", allSettings);
      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const regenerateJwtSecret = async () => {
    if (
      !window.confirm(
        "Are you sure you want to regenerate the JWT secret? This will invalidate all current sessions."
      )
    ) {
      return;
    }

    try {
      setSaving(true);
      const response = await axiosInstance.post("/admin/jwt/regenerate");
      setSecuritySettings((prev) => ({
        ...prev,
        jwtSecret: response.data.newSecret,
      }));
      toast.success("JWT Secret regenerated successfully");
    } catch (error) {
      console.error("Error regenerating JWT secret:", error);
      toast.error("Failed to regenerate JWT secret");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (setter) => (e) => {
    const { name, value, type, checked } = e.target;
    setter((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? value === ""
            ? ""
            : parseInt(value, 10)
          : value,
    }));
  };

  const handleGeneralChange = handleSettingChange(setGeneralSettings);
  const handleSecurityChange = handleSettingChange(setSecuritySettings);
  const handleNotificationChange = handleSettingChange(setNotificationSettings);
  const handleContentChange = handleSettingChange(setContentSettings);

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-base-content">
              General Settings
            </h3>
            <p className="mt-1 text-sm text-base-content/70 break-words">
              Configure basic application settings.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Site Name</span>
                </label>
                <input
                  type="text"
                  name="siteName"
                  value={generalSettings.siteName || ""}
                  onChange={handleGeneralChange}
                  className="input input-bordered w-full"
                  placeholder="My Application"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    The name of your application
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Contact Email</span>
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={generalSettings.contactEmail || ""}
                  onChange={handleGeneralChange}
                  className="input input-bordered w-full"
                  placeholder="admin@example.com"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Main contact for users and system notifications
                  </span>
                </label>
              </div>

              <div className="form-control w-full md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">
                    Site Description
                  </span>
                </label>
                <textarea
                  name="siteDescription"
                  value={generalSettings.siteDescription || ""}
                  onChange={handleGeneralChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="A brief description of your application"
                  rows={3}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Used in meta tags and about pages
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Default User Role
                  </span>
                </label>
                <select
                  name="defaultUserRole"
                  value={generalSettings.defaultUserRole || "user"}
                  onChange={handleGeneralChange}
                  className="select select-bordered w-full">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Default role assigned to new users
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Posts Per Page</span>
                </label>
                <input
                  type="number"
                  name="postsPerPage"
                  value={generalSettings.postsPerPage || ""}
                  onChange={handleGeneralChange}
                  className="input input-bordered w-full"
                  min="5"
                  max="100"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Number of posts to display per page (5-100)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Maximum Post Length
                  </span>
                </label>
                <input
                  type="number"
                  name="maxPostLength"
                  value={generalSettings.maxPostLength || ""}
                  onChange={handleGeneralChange}
                  className="input input-bordered w-full"
                  min="100"
                  max="10000"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Maximum characters allowed in a post (100-10000)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Logo URL</span>
                </label>
                <input
                  type="text"
                  name="logoUrl"
                  value={generalSettings.logoUrl || ""}
                  onChange={handleGeneralChange}
                  className="input input-bordered w-full"
                  placeholder="https://example.com/logo.png"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    URL to your application logo (optional)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Favicon URL</span>
                </label>
                <input
                  type="text"
                  name="faviconUrl"
                  value={generalSettings.faviconUrl || ""}
                  onChange={handleGeneralChange}
                  className="input input-bordered w-full"
                  placeholder="https://example.com/favicon.ico"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    URL to your favicon (optional)
                  </span>
                </label>
              </div>

              <div className="form-control md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="maintenanceMode"
                    checked={generalSettings.maintenanceMode || false}
                    onChange={handleGeneralChange}
                    className="toggle toggle-warning"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Maintenance Mode
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      When enabled, only admins can access the site.
                    </p>
                  </div>
                </label>
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="allowRegistration"
                    checked={generalSettings.allowRegistration || false}
                    onChange={handleGeneralChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Allow User Registration
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Allow new users to register on the platform.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-base-content">
              Security Settings
            </h3>
            <p className="mt-1 text-sm text-base-content/70 break-words">
              Manage password policies, authentication, and access control.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Minimum Password Length
                  </span>
                </label>
                <input
                  type="number"
                  name="passwordMinLength"
                  value={securitySettings.passwordMinLength || ""}
                  onChange={handleSecurityChange}
                  className="input input-bordered w-full"
                  min="6"
                  max="32"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Min characters for passwords (6-32)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Max Login Attempts
                  </span>
                </label>
                <input
                  type="number"
                  name="maxLoginAttempts"
                  value={securitySettings.maxLoginAttempts || ""}
                  onChange={handleSecurityChange}
                  className="input input-bordered w-full"
                  min="3"
                  max="20"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Failed attempts before lockout (3-20)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Session Timeout (seconds)
                  </span>
                </label>
                <input
                  type="number"
                  name="sessionTimeout"
                  value={securitySettings.sessionTimeout || ""}
                  onChange={handleSecurityChange}
                  className="input input-bordered w-full"
                  min="60"
                  max="604800"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Seconds until inactive users are logged out (60-604800)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    Lockout Duration (seconds)
                  </span>
                </label>
                <input
                  type="number"
                  name="lockoutDuration"
                  value={securitySettings.lockoutDuration || ""}
                  onChange={handleSecurityChange}
                  className="input input-bordered w-full"
                  min="300"
                  max="86400"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Seconds account is locked after failed attempts (300-86400)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">
                    JWT Expiry (seconds)
                  </span>
                </label>
                <input
                  type="number"
                  name="jwtExpiryTime"
                  value={securitySettings.jwtExpiryTime || ""}
                  onChange={handleSecurityChange}
                  className="input input-bordered w-full"
                  min="3600"
                  max="7776000"
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Seconds until JWT tokens expire (3600-7776000)
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">JWT Secret</span>
                </label>
                <div className="join w-full">
                  <input
                    type="password"
                    name="jwtSecret"
                    value={securitySettings.jwtSecret || ""}
                    className="input input-bordered join-item w-full"
                    readOnly
                  />
                  <button
                    className="btn join-item btn-neutral"
                    onClick={regenerateJwtSecret}
                    disabled={saving}>
                    <RefreshCw size={18} />
                  </button>
                </div>
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Secret key for signing JWT tokens (regenerate if needed).
                  </span>
                </label>
              </div>

              <div className="form-control w-full md:col-span-2">
                <label className="label">
                  <span className="label-text font-medium">
                    Admin IP Whitelist
                  </span>
                </label>
                <textarea
                  name="adminIpWhitelist"
                  value={securitySettings.adminIpWhitelist || ""}
                  onChange={handleSecurityChange}
                  className="textarea textarea-bordered w-full"
                  placeholder="e.g., 192.168.1.100, 10.0.0.0/16, 2001:db8::/32"
                  rows={3}
                />
                <label className="label">
                  <span className="label-text-alt text-base-content/60 break-words max-w-full">
                    Comma-separated IPs or CIDR ranges allowed access to admin
                    areas.
                  </span>
                </label>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="requireEmailVerification"
                    checked={securitySettings.requireEmailVerification || false}
                    onChange={handleSecurityChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Require Email Verification
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      New users must verify their email address before logging
                      in.
                    </p>
                  </div>
                </label>

                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="twoFactorAuthEnabled"
                    checked={securitySettings.twoFactorAuthEnabled || false}
                    onChange={handleSecurityChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Enable Two-Factor Auth (2FA)
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Allow users to enable 2FA for enhanced security.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-base-content">
              Notification Settings
            </h3>
            <p className="mt-1 text-sm text-base-content/70 break-words">
              Configure email, push, and system notifications.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 pt-4">
              <div className="space-y-4 flex flex-col">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="emailNotificationsEnabled"
                    checked={
                      notificationSettings.emailNotificationsEnabled || false
                    }
                    onChange={handleNotificationChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Enable Email Notifications
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Master switch for sending all notification emails.
                    </p>
                  </div>
                </label>

                <label
                  className={`label cursor-pointer justify-start gap-4 p-0 ${
                    !notificationSettings.emailNotificationsEnabled
                      ? "opacity-50"
                      : ""
                  }`}>
                  <input
                    type="checkbox"
                    name="welcomeEmailEnabled"
                    checked={notificationSettings.welcomeEmailEnabled || false}
                    onChange={handleNotificationChange}
                    className="toggle toggle-primary"
                    disabled={!notificationSettings.emailNotificationsEnabled}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Send Welcome Email
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Send a welcome email to newly registered users.
                    </p>
                  </div>
                </label>

                <label
                  className={`label cursor-pointer justify-start gap-4 p-0 ${
                    !notificationSettings.emailNotificationsEnabled
                      ? "opacity-50"
                      : ""
                  }`}>
                  <input
                    type="checkbox"
                    name="digestEmailsEnabled"
                    checked={notificationSettings.digestEmailsEnabled || false}
                    onChange={handleNotificationChange}
                    className="toggle toggle-primary"
                    disabled={!notificationSettings.emailNotificationsEnabled}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Send Digest Emails
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Send periodic activity summaries to users.
                    </p>
                  </div>
                </label>

                <div
                  className={`form-control w-full ${
                    !notificationSettings.emailNotificationsEnabled ||
                    !notificationSettings.digestEmailsEnabled
                      ? "opacity-50"
                      : ""
                  }`}>
                  <label className="label pb-1">
                    <span className="label-text font-medium">
                      Digest Frequency
                    </span>
                  </label>
                  <select
                    name="digestFrequency"
                    value={notificationSettings.digestFrequency || "weekly"}
                    onChange={handleNotificationChange}
                    className="select select-bordered select-sm w-full"
                    disabled={
                      !notificationSettings.emailNotificationsEnabled ||
                      !notificationSettings.digestEmailsEnabled
                    }>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 flex flex-col">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="adminAlertOnNewUsers"
                    checked={notificationSettings.adminAlertOnNewUsers || false}
                    onChange={handleNotificationChange}
                    className="toggle toggle-info"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Admin Alert: New Users
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Notify admins about new registrations.
                    </p>
                  </div>
                </label>

                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="adminAlertOnReports"
                    checked={notificationSettings.adminAlertOnReports || false}
                    onChange={handleNotificationChange}
                    className="toggle toggle-info"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Admin Alert: Content Reports
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Notify admins when users report content.
                    </p>
                  </div>
                </label>

                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="pushNotificationsEnabled"
                    checked={
                      notificationSettings.pushNotificationsEnabled || false
                    }
                    onChange={handleNotificationChange}
                    className="toggle toggle-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Enable Push Notifications
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Allow sending browser push notifications.
                    </p>
                  </div>
                </label>

                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="systemAnnouncementsEnabled"
                    checked={
                      notificationSettings.systemAnnouncementsEnabled || false
                    }
                    onChange={handleNotificationChange}
                    className="toggle toggle-accent"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Enable System Announcements
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Allow displaying global site-wide announcements.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>
        );

      case "content":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium leading-6 text-base-content">
              Content & Moderation Settings
            </h3>
            <p className="mt-1 text-sm text-base-content/70 break-words">
              Control user-generated content, uploads, and moderation features.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8 pt-4">
              <div className="space-y-4 flex flex-col">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="allowImages"
                    checked={contentSettings.allowImages || false}
                    onChange={handleContentChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Allow Images in Posts
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Permit users to include images in their posts.
                    </p>
                  </div>
                </label>
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="allowLinks"
                    checked={contentSettings.allowLinks || false}
                    onChange={handleContentChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Allow Links in Posts
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Permit users to include hyperlinks in their posts.
                    </p>
                  </div>
                </label>
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="allowMentions"
                    checked={contentSettings.allowMentions || false}
                    onChange={handleContentChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Allow User Mentions (@)
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Enable mentioning other users using @username.
                    </p>
                  </div>
                </label>
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="allowReplies"
                    checked={contentSettings.allowReplies || false}
                    onChange={handleContentChange}
                    className="toggle toggle-primary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Allow Replies to Posts
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Enable users to reply to existing posts.
                    </p>
                  </div>
                </label>
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="allowHtml"
                    checked={contentSettings.allowHtml || false}
                    onChange={handleContentChange}
                    className="toggle toggle-warning"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Allow HTML in Posts
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Allow limited safe HTML tags (use with caution).
                    </p>
                  </div>
                </label>
              </div>

              <div className="space-y-4 flex flex-col">
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="moderateContent"
                    checked={contentSettings.moderateContent || false}
                    onChange={handleContentChange}
                    className="toggle toggle-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Moderate New Content
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Require admin/moderator approval for new posts/comments.
                    </p>
                  </div>
                </label>
                <label className="label cursor-pointer justify-start gap-4 p-0">
                  <input
                    type="checkbox"
                    name="profanityFilter"
                    checked={contentSettings.profanityFilter || false}
                    onChange={handleContentChange}
                    className="toggle toggle-secondary"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="label-text font-medium">
                      Enable Profanity Filter
                    </span>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                      Automatically filter/censor common profanity.
                    </p>
                  </div>
                </label>

                <div className="pt-4 space-y-4 border-t border-base-300">
                  <label className="label cursor-pointer justify-start gap-4 p-0">
                    <input
                      type="checkbox"
                      name="allowFileUploads"
                      checked={contentSettings.allowFileUploads || false}
                      onChange={handleContentChange}
                      className="toggle toggle-accent"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="label-text font-medium">
                        Allow File Uploads
                      </span>
                      <p className="text-xs sm:text-sm text-base-content/60 mt-1 break-words">
                        Allow users to attach files to posts.
                      </p>
                    </div>
                  </label>
                  <div
                    className={`form-control w-full ${
                      !contentSettings.allowFileUploads ? "opacity-50" : ""
                    }`}>
                    <label className="label pb-1">
                      <span className="label-text font-medium">
                        Max File Size (bytes)
                      </span>
                    </label>
                    <input
                      type="number"
                      name="maxFileSize"
                      value={contentSettings.maxFileSize || ""}
                      onChange={handleContentChange}
                      className="input input-bordered input-sm w-full"
                      min="1048576"
                      max="104857600"
                      disabled={!contentSettings.allowFileUploads}
                    />
                    <label className="label pt-1">
                      <span className="label-text-alt text-base-content/60 break-words max-w-full">
                        Max size per file (1MB-100MB).
                      </span>
                    </label>
                  </div>
                  <div
                    className={`form-control w-full ${
                      !contentSettings.allowFileUploads ? "opacity-50" : ""
                    }`}>
                    <label className="label pb-1">
                      <span className="label-text font-medium">
                        Allowed File Types
                      </span>
                    </label>
                    <input
                      type="text"
                      name="allowedFileTypes"
                      value={contentSettings.allowedFileTypes || ""}
                      onChange={handleContentChange}
                      className="input input-bordered input-sm w-full"
                      placeholder="jpg,png,gif"
                      disabled={!contentSettings.allowFileUploads}
                    />
                    <label className="label pt-1">
                      <span className="label-text-alt text-base-content/60 break-words max-w-full">
                        Comma-separated list of allowed file extensions.
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab</div>;
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Globe },
    { id: "security", label: "Security", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "content", label: "Content", icon: FileText },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg">Loading Settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <div role="alert" className="alert alert-error">
          <AlertTriangle className="h-6 w-6" />
          <div>
            <h3 className="font-bold">Error Loading Settings</h3>
            <div className="text-xs">{error}</div>
          </div>
          <button className="btn btn-sm btn-ghost" onClick={fetchSettings}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 bg-base-200">
      <h1 className="text-2xl font-semibold text-base-content mb-6">
        Admin Settings
      </h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/4 xl:w-1/5">
          <ul className="menu p-4 w-full bg-base-100 rounded-box shadow-md">
            {tabs.map((tab) => (
              <li key={tab.id}>
                <button
                  className={`${
                    activeTab === tab.id
                      ? "active bg-primary text-primary-content"
                      : "text-base-content"
                  } hover:bg-base-300 flex items-center`}
                  onClick={() => setActiveTab(tab.id)}
                  aria-selected={activeTab === tab.id}>
                  <tab.icon size={18} className="mr-2" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="lg:w-3/4 xl:w-4/5 flex-1">
          <div className="bg-base-100 rounded-box shadow-md p-6">
            {renderTabContent()}
          </div>
          <div className="mt-6 p-4 bg-base-100 rounded-box shadow-md flex flex-col sm:flex-row justify-end items-center gap-3">
            <button
              className="btn btn-ghost"
              onClick={fetchSettings}
              disabled={loading || saving}>
              <RefreshCw size={18} className="mr-1" />
              Refresh
            </button>
            <button
              className="btn btn-primary"
              onClick={saveSettings}
              disabled={saving || loading}>
              {saving ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
