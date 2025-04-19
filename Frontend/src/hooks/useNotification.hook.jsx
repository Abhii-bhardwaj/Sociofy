// src/client/hooks/useNotification.hook.jsx
import { useState, useEffect, useCallback } from "react";
import { useSocket } from "./useSocket.hook";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore";
import { axiosInstance } from "../lib/axios";

export const useNotifications = () => {
  const { socket, connected } = useSocket();
  const { authUser } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const [processedIds, setProcessedIds] = useState(new Set());

  const fetchNotifications = useCallback(async () => {
    if (!authUser?._id) return;
    try {
      const { data } = await axiosInstance.get(
        `/notifications/${authUser._id}`
      );
      console.log(
        `Fetched notifications for ${authUser._id}:`,
        data.notifications
      );
      setNotifications(data.notifications);
      const unread = data.notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
      console.log(`Unread count set to: ${unread}`);
    } catch (error) {
      console.error(`Error fetching notifications:`, error);
    }
  }, [authUser]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const addNotification = useCallback(
    (notification) => {
      if (
        !notification?._id ||
        !notification?.content ||
        !notification?.type ||
        !notification?.sender ||
        processedIds.has(notification._id.toString())
      ) {
        console.warn(
          "Skipping invalid or duplicate notification:",
          notification
        );
        return;
      }

      setProcessedIds((prev) => new Set(prev).add(notification._id.toString()));
      setNotifications((prev) => {
        if (
          prev.some((n) => n._id.toString() === notification._id.toString())
        ) {
          return prev;
        }
        const updatedNotifications = [
          { ...notification, read: notification.read ?? false },
          ...prev,
        ];
        const unread = updatedNotifications.filter((n) => !n.read).length;
        setUnreadCount(unread);
        console.log(
          `Added notification, new unread count: ${unread}`,
          updatedNotifications
        );
        return updatedNotifications;
      });

      toast.custom(
        (t) => (
          <div
            className={`alert max-w-md w-full bg-base-200 border border-base-300 shadow-lg rounded-xl p-4 flex items-start gap-3 cursor-pointer transform transition-all duration-300 hover:bg-base-300 hover:shadow-2xl animate-slide-in ${
              t.visible ? "opacity-100" : "opacity-0 animate-fade-out"
            }`}
            onClick={() => {
              if (notification.type === "message") {
                navigate(`/messages/${notification.chatId}`);
              } else if (
                [
                  "like",
                  "comment",
                  "post_share",
                  "comment_like",
                  "comment_reply",
                ].includes(notification.type)
              ) {
                navigate(`/post/${notification.postId}`);
              } else if (notification.type === "follow") {
                navigate(`/profile/${notification.sender._id}`);
              }
              toast.dismiss(t.id);
            }}>
            <div className="avatar">
              <div className="w-10 h-10 rounded-full">
                <img
                  src={notification.sender?.profilePic || "./placeholder.jpeg"}
                  alt="Sender"
                  className="w-10 h-10 object-cover rounded-full"
                  onError={(e) => (e.target.src = "./placeholder.jpeg")}
                />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-base-content text-sm font-semibold">
                {notification.sender?.username || "Unknown"}
              </p>
              <p className="text-base-content text-sm">
                {notification.content}
              </p>
              <span className="text-xs text-base-content/60">
                {new Date(notification.timestamp).toLocaleString()}
              </span>
            </div>
            <button
              className="btn btn-ghost btn-xs text-base-content/60 hover:text-error"
              onClick={(e) => {
                e.stopPropagation();
                toast.dismiss(t.id);
              }}>
              ✕
            </button>
          </div>
        ),
        {
          duration: 5000,
          position: "top-right",
          id: notification._id.toString(),
        }
      );
    },
    [navigate, processedIds]
  );

  useEffect(() => {
    if (!socket || !connected) return;

    socket.on("notification", (data) => {
      console.log("New notification received:", data);
      addNotification(data);
    });

    return () => {
      socket.off("notification");
    };
  }, [socket, connected, addNotification]);

  const clearNotification = useCallback(
    async (id) => {
      try {
        await axiosInstance.delete(`/notifications/${id}`);
        setNotifications((prev) =>
          prev.filter((n) => n._id.toString() !== id.toString())
        );
        setProcessedIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(id.toString());
          return newSet;
        });
        const unread = notifications.filter(
          (n) => !n.read && n._id.toString() !== id.toString()
        ).length;
        setUnreadCount(unread);
        console.log(`Cleared notification ${id}, new unread count: ${unread}`);
      } catch (error) {
        console.error(`Error clearing notification ${id}:`, error);
      }
    },
    [notifications]
  );

  const clearAllNotifications = useCallback(async () => {
    try {
      await axiosInstance.delete(`/notifications/all/${authUser?._id}`);
      setNotifications([]);
      setProcessedIds(new Set());
      setUnreadCount(0);
      console.log("Cleared all notifications");
    } catch (error) {
      console.error(`Error clearing all notifications:`, error);
    }
  }, [authUser]);

  const markAllAsRead = useCallback(async () => {
    try {
      await axiosInstance.post(`/notifications/mark-all-read/${authUser?._id}`);
      await fetchNotifications(); // Refresh notifications after marking as read
      console.log("Marked all notifications as read, refreshed notifications");
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  }, [authUser, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    clearNotification,
    clearAllNotifications,
    markAllAsRead,
    fetchNotifications, // Expose for manual refresh if needed
  };
};
