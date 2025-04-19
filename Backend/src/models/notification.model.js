// src/server/models/notification.model.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  type: {
    type: String,
    enum: [
      "message",
      "like",
      "comment",
      "post_share",
      "comment_like",
      "comment_reply",
      "system",
    ],
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedId: {
    type: String, // Or ObjectId
    required: true,
  },
  relatedModel: {
    type: String,
    enum: ["Message", "Post", "Comment", null],
    required: true,
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});


const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;
