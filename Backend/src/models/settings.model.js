import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
  general: {
    siteName: { type: String, default: "Sociofy" },
    siteDescription: { type: String, default: "Connect with the world" },
    maintenanceMode: { type: Boolean, default: false },
    allowRegistration: { type: Boolean, default: true },
    maxPostLength: { type: Number, default: 280 },
    postsPerPage: { type: Number, default: 20 },
    defaultUserRole: { type: String, enum: ["user", "admin"], default: "user" },
    contactEmail: { type: String, default: "support@sociofy.com" },
    logoUrl: { type: String, default: "" },
    faviconUrl: { type: String, default: "" },
  },
  security: {
    passwordMinLength: { type: Number, default: 8 },
    requireEmailVerification: { type: Boolean, default: true },
    twoFactorAuthEnabled: { type: Boolean, default: false },
    sessionTimeout: { type: Number, default: 3600 }, // in seconds
    maxLoginAttempts: { type: Number, default: 5 },
    lockoutDuration: { type: Number, default: 900 }, // in seconds
    adminIpWhitelist: { type: String, default: "" },
    jwtSecret: { type: String, default: "" },
    jwtExpiryTime: { type: Number, default: 86400 }, // in seconds
  },
  notifications: {
    emailNotificationsEnabled: { type: Boolean, default: true },
    welcomeEmailEnabled: { type: Boolean, default: true },
    digestEmailsEnabled: { type: Boolean, default: false },
    digestFrequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "weekly",
    },
    adminAlertOnNewUsers: { type: Boolean, default: true },
    adminAlertOnReports: { type: Boolean, default: true },
    pushNotificationsEnabled: { type: Boolean, default: true },
    systemAnnouncementsEnabled: { type: Boolean, default: true },
  },
  content: {
    allowImages: { type: Boolean, default: true },
    allowLinks: { type: Boolean, default: true },
    allowHtml: { type: Boolean, default: false },
    allowMentions: { type: Boolean, default: true },
    allowReplies: { type: Boolean, default: true },
    moderateContent: { type: Boolean, default: false },
    profanityFilter: { type: Boolean, default: false },
    allowFileUploads: { type: Boolean, default: true },
    maxFileSize: { type: Number, default: 5242880 }, // 5MB in bytes
    allowedFileTypes: { type: String, default: "jpg,png,gif" },
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure only one settings document exists
settingsSchema.index({ _id: 1 }, { unique: true });

const Settings = mongoose.model("Settings", settingsSchema);

export default Settings;
