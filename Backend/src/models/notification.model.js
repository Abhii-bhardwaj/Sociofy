// models/notification.model.js
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "like",
      "comment",
      "friend_request",
      "message", // For new messages
      "mention",
      "follow",
      "post_share",
      "event_invitation",
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "relatedModel", // Dynamic ref based on type
  },
  relatedModel: {
    type: String,
    enum: ["Post", "Comment", "Message"], // Added Message
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
});

const Notification = mongoose.model("Notification", notificationSchema);

module.exports = Notification;
