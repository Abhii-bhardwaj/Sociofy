import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaTrash,
  FaEye,
  FaPaperPlane,
  FaFilter,
  FaSync,
  FaBell,
} from "react-icons/fa";
import { axiosInstance } from "../../lib/axios"; // Make sure this path is correct

// Assuming StatsCard is imported correctly
// import StatsCard from "./StatsCard";

// --- Mock StatsCard for demonstration if not available ---
const StatsCard = ({ title, value, icon, className }) => (
  <div className={`card p-4 ${className}`}>
    <div className="flex items-center space-x-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <div className="text-sm text-base-content/70">{title}</div>
        <div className="text-xl font-bold">{value}</div>
      </div>
    </div>
  </div>
);
// --- End Mock StatsCard ---

const ManageNotifications = () => {
  const [allNotifications, setAllNotifications] = useState([]);
  const [displayedNotifications, setDisplayedNotifications] = useState([]);
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [typeCounts, setTypeCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const [viewingNotification, setViewingNotification] = useState(null);
  const [systemMessage, setSystemMessage] = useState("");

  const limit = 20;
  const notificationTypes = [
    "All Types",
    "message",
    "like",
    "comment",
    "post_share",
    "comment_like",
    "comment_reply",
    "system",
  ];

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/admin/notifications", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        withCredentials: true,
      });

      const data = response.data;
      if (data && Array.isArray(data.notifications)) {
        setAllNotifications(data.notifications);
        setTotalNotifications(data.notifications.length);

        // Calculate type counts for stats
        const counts = {};
        notificationTypes.forEach((type) => {
          if (type === "All Types") return;
          counts[type] = data.notifications.filter(
            (n) => n.type === type
          ).length;
        });
        setTypeCounts(counts);

        toast.success("Notifications loaded successfully");
      } else {
        console.error("Unexpected data structure:", data);
        toast.error("Server returned unexpected data format");
        setAllNotifications([]); // Reset to empty array on error
        setTotalNotifications(0);
        setTypeCounts({});
      }
    } catch (error) {
      console.error("Axios error:", error);
      if (error.response) {
        console.error("Error data:", error.response.data);
        console.error("Error status:", error.response.status);
        toast.error(
          `Server error: ${error.response.status} - ${
            error.response.data?.message || "Unknown error"
          }`
        );
      } else if (error.request) {
        toast.error("No response from server");
      } else {
        toast.error(`Error: ${error.message}`);
      }
      // Reset state on error
      setAllNotifications([]);
      setTotalNotifications(0);
      setTypeCounts({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Fetch only once on mount

  useEffect(() => {
    // Client-side filtering based on typeFilter
    const filteredNotifications =
      typeFilter === "All Types"
        ? allNotifications
        : allNotifications.filter((n) => n.type === typeFilter);

    // Update pagination
    const newTotalPages = Math.ceil(filteredNotifications.length / limit);
    setTotalPages(newTotalPages > 0 ? newTotalPages : 1); // Ensure totalPages is at least 1

    // Reset to page 1 if current page exceeds total pages after filtering or if it becomes 0
    const currentPage = page > newTotalPages && newTotalPages > 0 ? 1 : page;
    if (page !== currentPage) {
      setPage(currentPage);
    }

    const start = (currentPage - 1) * limit;
    const end = start + limit;
    setDisplayedNotifications(filteredNotifications.slice(start, end));
  }, [typeFilter, page, allNotifications, limit]);

  const handleTypeFilter = (e) => {
    setTypeFilter(e.target.value);
    setPage(1); // Reset to first page on filter change
  };

  const handleDelete = async (notificationId) => {
    if (!window.confirm("Are you sure you want to delete this notification?"))
      return;

    try {
      const response = await axiosInstance.delete(
        `/admin/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        toast.success(
          response.data.message || "Notification deleted successfully"
        );
        // Optimistic UI update or re-fetch
        setAllNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
        // Note: Re-fetching fetchNotifications() might be simpler if counts need exact update
      } else {
        toast.error(response.data.message || "Failed to delete notification");
      }
    } catch (error) {
      toast.error("Error deleting notification");
      console.error("Delete notification error:", error);
    }
  };

  const handleView = (notification) => {
    setViewingNotification(notification);
  };

  const handleSendSystemNotification = async () => {
    if (!systemMessage.trim()) {
      toast.error("Message cannot be empty");
      return;
    }

    try {
      const response = await axiosInstance.post(
        "/admin/notifications",
        { message: systemMessage, type: "system" }, // Ensure type is sent if needed by backend
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json", // Good practice to include
          },
          withCredentials: true,
        }
      );

      if (response.status === 201 || response.status === 200) {
        toast.success(
          response.data.message || "System notification sent successfully"
        );
        setSystemMessage("");
        fetchNotifications(); // Refresh to see the new system notification
      } else {
        toast.error(response.data.message || "Failed to send notification");
      }
    } catch (error) {
      toast.error(
        `Error sending notification: ${
          error.response?.data?.message || error.message
        }`
      );
      console.error("Send notification error:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true, // Use AM/PM
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Helper function to get DaisyUI badge styles for notification types
  const getTypeStyles = (type) => {
    switch (type) {
      case "message":
        return "badge-primary";
      case "like":
        return "badge-secondary"; // Changed to secondary for variety
      case "comment":
        return "badge-success";
      case "post_share":
        return "badge-accent";
      case "comment_like":
        return "badge-warning";
      case "comment_reply":
        return "badge-info";
      case "system":
        return "badge-neutral text-neutral-content"; // Added text color for contrast
      default:
        return "badge-ghost";
    }
  };

  const getFilteredCount = () => {
    if (typeFilter === "All Types") {
      return totalNotifications;
    }
    return allNotifications.filter((n) => n.type === typeFilter).length;
  };

  const filteredCount = getFilteredCount();
  const startItem = Math.min((page - 1) * limit + 1, filteredCount);
  const endItem = Math.min(page * limit, filteredCount);

  // Table columns to display based on screen size
  const renderTableContent = () => {
    return (
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="table w-full table-zebra">
          <thead>
            <tr>
              <th className="hidden sm:table-cell">Sender</th>
              <th className="hidden md:table-cell">Receiver</th>
              <th>Type</th>
              <th className="min-w-[120px]">Message</th>
              <th className="hidden sm:table-cell">Date</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedNotifications.map((notification) => (
              <tr key={notification._id} className="hover">
                <td className="hidden sm:table-cell">
                  {notification.sender ? (
                    <div className="flex items-center space-x-3">
                      <div className="avatar">
                        <div className="mask mask-squircle w-8 h-8">
                          <img
                            src={
                              notification.sender.profilePic ||
                              "/placeholder.jpeg"
                            }
                            alt={notification.sender.fullName || "Sender"}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.jpeg";
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {notification.sender.fullName || "N/A"}
                        </p>
                        <p className="text-xs text-base-content/70">
                          @{notification.sender.username || "N/A"}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="badge badge-sm badge-primary">System</span>
                  )}
                </td>
                <td className="hidden md:table-cell">
                  {notification.userId ? (
                    <div>
                      <p className="font-medium text-sm">
                        {notification.userId.fullName || "N/A"}
                      </p>
                      <p className="text-xs text-base-content/70">
                        @{notification.userId.username || "N/A"}
                      </p>
                    </div>
                  ) : (
                    <span className="badge badge-sm badge-success">
                      All Users
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge badge-sm ${getTypeStyles(
                      notification.type
                    )}`}>
                    {notification.type === "system"
                      ? "System"
                      : notification.type === "message"
                      ? "Msg"
                      : notification.type
                          .split("_")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                  </span>
                </td>
                <td>
                  <p className="text-sm truncate max-w-[150px] sm:max-w-[250px] md:max-w-none">
                    {notification.message}
                  </p>
                </td>
                <td className="hidden sm:table-cell text-xs text-base-content/70 whitespace-nowrap">
                  {formatDate(notification.createdAt)}
                </td>
                <td className="text-center whitespace-nowrap">
                  <button
                    onClick={() => handleView(notification)}
                    className="btn btn-ghost btn-xs"
                    aria-label="View Notification">
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="btn btn-ghost btn-xs text-error"
                    aria-label="Delete Notification">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Mobile card view for notifications (as alternative to table on very small screens)
  const renderMobileCardView = () => {
    return (
      <div className="grid grid-cols-1 gap-4 sm:hidden px-4">
        {" "}
        {/* Only show on smallest screens */}
        {displayedNotifications.map((notification) => (
          <div key={notification._id} className="card bg-base-200 shadow-sm">
            <div className="card-body p-4">
              <div className="flex justify-between items-center mb-2">
                <span className={`badge ${getTypeStyles(notification.type)}`}>
                  {notification.type
                    .split("_")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </span>
                <div className="text-xs text-base-content/70">
                  {formatDate(notification.createdAt).split(",")[0]}
                </div>
              </div>

              <p className="text-sm mb-3">{notification.message}</p>

              <div className="flex justify-between items-center mt-2">
                <div className="text-xs">
                  {notification.sender
                    ? `From: ${notification.sender.fullName || "System"}`
                    : "System Notification"}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(notification)}
                    className="btn btn-ghost btn-xs"
                    aria-label="View Notification">
                    <FaEye />
                  </button>
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="btn btn-ghost btn-xs text-error"
                    aria-label="Delete Notification">
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-3 sm:p-6 bg-base-100 min-h-screen text-base-content">
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Notification Management
        </h1>
        <p className="text-base-content/70 mt-1 text-sm sm:text-base">
          View, filter, and manage system notifications
        </p>
      </div>

      {/* Stats Overview - Make it more responsive with smaller grid on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
        <StatsCard
          title="Total"
          value={totalNotifications}
          icon={<FaBell className="text-primary" />}
          className="bg-base-100 shadow-md sm:shadow-xl border border-base-300"
        />
        {/* For mobile, show only a few important stats */}
        {Object.entries(typeCounts)
          .filter((_, index) => (window.innerWidth < 640 ? index < 3 : true)) // Only first 3 on mobile
          .map(([type, count]) => (
            <StatsCard
              key={type}
              title={`${
                type === "post_share"
                  ? "Shares"
                  : type === "comment_reply"
                  ? "Replies"
                  : type.charAt(0).toUpperCase() + type.slice(1)
              }`}
              value={count}
              icon={<FaPaperPlane className="text-secondary" />}
              className="bg-base-100 shadow-md sm:shadow-xl border border-base-300"
            />
          ))}
      </div>

      {/* Control Panel - Stack on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* System Notification Form */}
        <div className="lg:col-span-2 card bg-base-100 shadow-md sm:shadow-xl border border-base-300">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title flex items-center mb-2 sm:mb-4 text-lg sm:text-xl">
              <FaPaperPlane className="mr-2 text-primary" />
              Send System Notification
            </h2>
            <div className="flex flex-col space-y-3 sm:space-y-4">
              <textarea
                value={systemMessage}
                onChange={(e) => setSystemMessage(e.target.value)}
                placeholder="Enter system notification message"
                className="textarea textarea-bordered w-full h-20 sm:h-24"
                rows="3"
              />
              <button
                onClick={handleSendSystemNotification}
                className="btn btn-primary self-end flex items-center btn-sm sm:btn-md">
                <FaPaperPlane className="mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Send Notification</span>
                <span className="xs:hidden">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Panel */}
        <div className="card bg-base-100 shadow-md sm:shadow-xl border border-base-300">
          <div className="card-body p-4 sm:p-6">
            <h2 className="card-title flex items-center mb-2 sm:mb-4 text-lg sm:text-xl">
              <FaFilter className="mr-2 text-primary" />
              Filter
            </h2>
            <div className="space-y-3 sm:space-y-4">
              <div>
                <label className="label pb-1 pt-0">
                  <span className="label-text">Notification Type</span>
                </label>
                <select
                  value={typeFilter}
                  onChange={handleTypeFilter}
                  className="select select-bordered w-full select-sm sm:select-md">
                  {notificationTypes.map((type) => (
                    <option key={type} value={type}>
                      {type === "All Types"
                        ? type
                        : type
                            .split("_")
                            .map(
                              (word) =>
                                word.charAt(0).toUpperCase() + word.slice(1)
                            )
                            .join(" ")}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={fetchNotifications}
                disabled={loading}
                className="btn btn-outline w-full flex items-center justify-center btn-sm sm:btn-md">
                <FaSync
                  className={`mr-1 sm:mr-2 ${loading ? "animate-spin" : ""}`}
                />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notification List */}
      <div className="card bg-base-100 shadow-md sm:shadow-xl border border-base-300 overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-base-300 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <h2 className="text-base sm:text-lg font-semibold">
            {typeFilter === "All Types"
              ? "All Notifications"
              : `${typeFilter
                  .split("_")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")} Notifications`}
          </h2>
          <span className="text-xs sm:text-sm text-base-content/70">
            Showing {displayedNotifications.length > 0 ? startItem : 0}
            {displayedNotifications.length > 0 ? ` to ${endItem}` : ""} of{" "}
            {filteredCount}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/70 mt-4">
              Loading notifications...
            </p>
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <FaBell className="mx-auto text-base-content/30 text-4xl sm:text-5xl mb-3 sm:mb-4" />
            <p className="text-base-content/70 text-sm sm:text-base">
              No notifications found{" "}
              {typeFilter !== "All Types" ? `for type "${typeFilter}"` : ""}
            </p>
          </div>
        ) : (
          <>
            {/* Table for larger screens */}
            <div className="hidden sm:block">{renderTableContent()}</div>

            {/* Card view for mobile */}
            {renderMobileCardView()}

            {/* Show table even on small screens, but with fewer columns */}
            {/* <div className="sm:hidden">{renderTableContent()}</div> */}
          </>
        )}

        {/* Pagination - Now with better mobile support */}
        {totalPages > 1 && displayedNotifications.length > 0 && (
          <div className="p-3 sm:p-4 border-t border-base-300 flex flex-col xs:flex-row items-center justify-between gap-3">
            {/* Show simplified info on mobile */}
            <div className="text-center xs:text-left w-full xs:w-auto">
              <p className="text-xs sm:text-sm text-base-content/70">
                <span className="hidden sm:inline">Showing </span>
                <span className="font-medium">
                  {startItem}-{endItem}
                </span>
                <span className="hidden sm:inline"> of </span>
                <span className="sm:hidden"> / </span>
                <span className="font-medium">{filteredCount}</span>
              </p>
            </div>

            {/* Simplified pagination for mobile */}
            <div className="join">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1 || loading}
                className="join-item btn btn-xs sm:btn-sm btn-outline"
                aria-label="Previous Page">
                ←
              </button>

              {/* Very compact on mobile, show fewer page buttons */}
              {window.innerWidth < 640 ? (
                // Simplified mobile view: prev, current/total, next
                <button className="join-item btn btn-xs sm:btn-sm btn-outline">
                  {page}/{totalPages}
                </button>
              ) : (
                // Desktop view: show more page numbers
                <>
                  {page > 2 && totalPages > 3 && (
                    <button
                      onClick={() => setPage(1)}
                      className="join-item btn btn-xs sm:btn-sm btn-outline">
                      1
                    </button>
                  )}
                  {page > 3 && totalPages > 4 && (
                    <button className="join-item btn btn-xs sm:btn-sm btn-disabled btn-outline">
                      ...
                    </button>
                  )}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (pageNum) =>
                        Math.abs(pageNum - page) < 2 ||
                        pageNum === 1 ||
                        pageNum === totalPages
                    )
                    .filter(
                      (pageNum, index, arr) =>
                        index === 0 ||
                        pageNum > arr[index - 1] + 1 ||
                        pageNum === arr[index - 1] + 1
                    )
                    .map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        disabled={loading}
                        className={`join-item btn btn-xs sm:btn-sm ${
                          page === pageNum
                            ? "btn-active btn-primary"
                            : "btn-outline"
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={page === pageNum ? "page" : undefined}>
                        {pageNum}
                      </button>
                    ))}
                  {page < totalPages - 2 && totalPages > 4 && (
                    <button className="join-item btn btn-xs sm:btn-sm btn-disabled btn-outline">
                      ...
                    </button>
                  )}
                  {page < totalPages - 1 && totalPages > 3 && (
                    <button
                      onClick={() => setPage(totalPages)}
                      className="join-item btn btn-xs sm:btn-sm btn-outline">
                      {totalPages}
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages || loading}
                className="join-item btn btn-xs sm:btn-sm btn-outline"
                aria-label="Next Page">
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View Modal - Improved for mobile */}
      {viewingNotification && (
        <div className="modal modal-open">
          <div className="modal-box relative max-w-md mx-auto">
            <button
              onClick={() => setViewingNotification(null)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
              aria-label="Close modal">
              ✕
            </button>
            <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">
              Notification Details
            </h2>
            <div className="space-y-3">
              {/* Sender */}
              <div>
                <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                  Sender
                </p>
                <div className="font-medium mt-1 text-sm">
                  {viewingNotification.sender ? (
                    <div className="flex items-center space-x-2">
                      <div className="avatar">
                        <div className="mask mask-squircle w-6 h-6">
                          <img
                            src={
                              viewingNotification.sender.profilePic ||
                              "/placeholder.jpeg"
                            }
                            alt={
                              viewingNotification.sender.fullName || "Sender"
                            }
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/placeholder.jpeg";
                            }}
                          />
                        </div>
                      </div>
                      <span>{`${
                        viewingNotification.sender.fullName || "N/A"
                      } (@${
                        viewingNotification.sender.username || "N/A"
                      })`}</span>
                    </div>
                  ) : (
                    <span className="badge badge-primary">System</span>
                  )}
                </div>
              </div>
              {/* Receiver */}
              <div>
                <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                  Receiver
                </p>
                <div className="font-medium mt-1 text-sm">
                  {viewingNotification.userId ? (
                    `${viewingNotification.userId.fullName || "N/A"} (@${
                      viewingNotification.userId.username || "N/A"
                    })`
                  ) : (
                    <span className="badge badge-success">All Users</span>
                  )}
                </div>
              </div>
              {/* Type */}
              <div>
                <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                  Type
                </p>
                <div className="font-medium mt-1">
                  <span
                    className={`badge ${getTypeStyles(
                      viewingNotification.type
                    )}`}>
                    {viewingNotification.type
                      .split("_")
                      .map(
                        (word) => word.charAt(0).toUpperCase() + word.slice(1)
                      )
                      .join(" ")}
                  </span>
                </div>
              </div>
              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                  Message
                </p>
                <div className="bg-base-200 p-3 rounded mt-1 text-sm">
                  {viewingNotification.message}
                </div>
              </div>
              {/* Date */}
              <div>
                <p className="text-xs font-semibold text-base-content/70 uppercase tracking-wider">
                  Date
                </p>
                <div className="font-medium mt-1 text-sm">
                  {formatDate(viewingNotification.createdAt)}
                </div>
              </div>
            </div>
            <div className="modal-action mt-5 sm:mt-6">
              <button
                onClick={() => setViewingNotification(null)}
                className="btn btn-sm sm:btn-md btn-outline">
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop">
            <button onClick={() => setViewingNotification(null)}>close</button>
          </form>
        </div>
      )}
      {/* Toast Notifications for mobile - more compact design */}
      <div className="toast-container fixed bottom-4 right-4 left-4 sm:left-auto z-50">
        {/* Toast will be injected here by react-hot-toast */}
      </div>

      {/* Optional: Quick Action Floating Button for Mobile */}
      <div className="fixed bottom-6 right-6 sm:hidden">
        <button
          onClick={fetchNotifications}
          className="btn btn-circle btn-primary shadow-lg"
          disabled={loading}
          aria-label="Refresh Notifications">
          <FaSync className={loading ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
};

export default ManageNotifications;
