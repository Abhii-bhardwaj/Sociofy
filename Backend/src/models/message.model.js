// models/message.model.js
import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      enum: ["text", "image", "video", "audio", "file", "deleted"], // Add more types as needed
      default: "text",
    },
    chatId: {
      type: String, // Format: "senderId:receiverId" or vice versa, sorted for uniqueness
      required: true,
      index: true, // Faster lookups for chats
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      // For soft delete
      type: Boolean,
      default: false,
    },
    deliveryStatus: {
      type: String,
      enum: ["sent", "delivered", "read", "failed"],
      default: "sent",
    },
  },
  { timestamps: true }
);

// Add indexes for common queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, isRead: 1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
