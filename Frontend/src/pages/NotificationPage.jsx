import React, { useEffect } from "react";
import { useNotifications } from "../hooks/useNotification.hook.jsx";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const NotificationsPage = () => {
  const {
    notifications,
    clearNotification,
    clearAllNotifications,
    markAllAsRead,
  } = useNotifications();
  const navigate = useNavigate();

  // Automatically mark all notifications as read when the page loads
  useEffect(() => {
    if (notifications.length > 0) {
      markAllAsRead();
    }
  }, [markAllAsRead, notifications.length]);

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="min-h-screen bg-base-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="btn btn-ghost btn-sm">
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold text-base-content">
              Notifications
            </h1>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="btn btn-ghost btn-sm text-error">
              Clear All
            </button>
          )}
        </div>

        {/* Notifications List */}
        {notifications.length > 0 ? (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className="flex items-start gap-4 p-4 bg-base-200 rounded-lg border border-base-300 shadow-sm hover:shadow-md transition-shadow duration-200">
                {/* Avatar */}
                <div className="avatar">
                  <div className="w-12 h-12 rounded-full">
                    <img
                      src={notif.sender?.profilePic || "./placeholder.jpeg"}
                      alt="Sender"
                      className="w-12 h-12 object-cover rounded-full"
                      onError={(e) => (e.target.src = "./placeholder.jpeg")}
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p className="text-base-content text-sm font-semibold">
                    {notif.sender?.username ||
                      (notif.type === "system" ? "System" : "Unknown")}
                  </p>
                  <p className="text-base-content text-sm">{notif.message}</p>
                  <span className="text-xs text-base-content/60">
                    {formatDate(notif.createdAt)}
                  </span>
                  {/* Actions */}
                  {notif.type === "message" && (
                    <button
                      onClick={() => navigate(`/messages`)}
                      className="btn btn-ghost btn-xs mt-2">
                      View Chat
                    </button>
                  )}
                  {[
                    "like",
                    "comment",
                    "post_share",
                    "comment_like",
                    "comment_reply",
                  ].includes(notif.type) && (
                    <button
                      onClick={() => navigate(`/post/${notif.relatedId}`)}
                      className="btn btn-ghost btn-xs mt-2">
                      View Post
                    </button>
                  )}
                  {notif.type === "system" && (
                    <span className="badge badge-neutral mt-2">
                      System Notification
                    </span>
                  )}
                </div>

                {/* Clear Button */}
                <button
                  onClick={() => clearNotification(notif._id)}
                  className="btn btn-ghost btn-xs text-error">
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
            <p className="text-base-content/60 text-lg">
              No notifications yet!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
