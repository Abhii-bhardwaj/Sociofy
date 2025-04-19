import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true, // Add index for faster email lookups
    },
    fullName: {
      type: String,
      required: false,
    },
    username: {
      type: String,
      required: false,
      unique: true,
      lowercase: true, // Convert username to lowercase before saving
      index: true, // Add index for faster username lookups
    },
    password: {
      type: String,
      minlength: 8,
      validate: {
        validator: function (value) {
          // ✅ Password is required ONLY if no OAuth ID is present
          if (!this.googleId) {
            return value && value.length >= 8;
          }
          return true; // Skip validation for Google/Facebook users
        },
        message: "Password must be at least 8 characters long.",
      },
    },
    profilePic: {
      type: String,
      default: "placeholder.jpeg",
    },
    bio: {
      type: String,
      default: "",
    },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], // New Field
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true, // Add index for faster role-based queries
    },
    otp: {
      value: { type: String },
      expiration: { type: Date, default: Date.now, expires: 600 }, // 600 seconds (10 minutes)
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
      index: true, // Add index for faster Google ID lookups
    },
    followers: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ], // New Field
    following: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    ], // New Field
    chats: [
      {
        chatId: {
          type: String, // References Message.chatId
          required: true,
        },
        lastMessage: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Message", // Reference to the latest message in this chat
        },
        lastActive: {
          type: Date,
          default: Date.now,
          index: true, // ✅ Fast lookup
        },
      },
    ],
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    location: {
      city: { type: String, index: true },
      state: { type: String, index: true },
      country: { type: String, index: true },
    },
    lastActive: { type: Date, default: Date.now, index: true }, // ✅ Moved to global scope
    isDeleted: { type: Boolean, default: false }, // Soft delete flag
    isSuspended: { type: Boolean, default: false }, // Suspension flag
    isFlagged: {type: Boolean, default: false}, // Flagged by admin
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
