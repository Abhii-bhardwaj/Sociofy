// src/server/controllers/notification.controller.js
import Notification from "../models/notification.model.js";
import { redis } from "../lib/redis.js";

// Fetch user-specific and system notifications
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch notifications where user is the receiver or userId
    const notifications = await Notification.find({
      $or: [
        { userId: userId }, // Legacy userId-based notifications
        { receiver: userId }, // Notifications with receiver field
        { userId: null, type: "system" }, // System notifications for all users
      ],
    })
      .populate("sender", "username profilePic fullName")
      .sort({ createdAt: -1 });

    console.log(`Returning notifications for ${userId}:`, notifications);
    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user has permission to delete
    if (
      notification.userId && // User-specific notification
      notification.userId.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Unauthorized to delete this notification" });
    }

    // System notifications can only be deleted by admins
    if (notification.type === "system" && !req.user.isAdmin) {
      return res.status(403).json({ message: "Only admins can delete system notifications" });
    }

    await Notification.findByIdAndDelete(id);

    // Clear cache
    const cacheKey = `notifications:${userId}`;
    await redis.del(cacheKey);

    res.status(200).json({ message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete all user-specific notifications
export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    // Only delete user-specific notifications, exclude system notifications
    await Notification.deleteMany({ userId, type: { $ne: "system" } });

    // Clear cache
    const cacheKey = `notifications:${userId}`;
    await redis.del(cacheKey);

    console.log(`Cleared user-specific notifications and cache for user ${userId}`);
    res.status(200).json({ message: "All user notifications deleted" });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;

    // Mark both user-specific and system notifications as read
    const updated = await Notification.updateMany(
      {
        $or: [
          { userId, read: false }, // User-specific unread notifications
          { userId: null, type: "system", read: false }, // Unread system notifications
        ],
      },
      { read: true }
    );

    // Clear cache
    const cacheKey = `notifications:${userId}`;
    await redis.del(cacheKey);

    console.log(
      `Marked ${updated.modifiedCount} notifications as read for user ${userId}, cache cleared`
    );
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};
