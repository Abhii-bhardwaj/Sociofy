import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  FaSearch,
  FaUser,
  FaTrash,
  FaLock,
  FaUnlock,
  FaUserShield,
  FaEllipsisV,
} from "react-icons/fa";
import StatsCard from "./statsCard";
import { axiosInstance } from "../../lib/axios";
import defaulProfilePic from "/placeholder.jpeg";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [adminCount, setAdminCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);

  const limit = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `/admin/users?q=${searchTerm}&page=${page}&limit=${limit}`
      );

      const data = response.data;

      setUsers(data.users);
      setTotalPages(data.pages);
      setTotalUsers(data.total);
      setAdminCount(data.users.filter((u) => u.role === "admin").length);
      setUserCount(data.users.filter((u) => u.role === "user").length);
    } catch (error) {
      toast.error("Error fetching users");
      console.error("Fetch users error:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, page]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await axiosInstance.delete(`/admin/users/${userId}`);
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error deleting user");
      console.error("Delete user error:", error);
    }
  };

  const handleToggleBan = async (userId, isSuspended) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}`, {
        isSuspended: !isSuspended,
      });
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating user");
      console.error("Toggle ban error:", error);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const response = await axiosInstance.put(`/admin/users/${userId}`, {
        role: newRole,
      });
      toast.success(response.data.message);
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating role");
      console.error("Role change error:", error);
    }
  };

  const toggleDropdown = (e, userId) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === userId ? null : userId);
  };

  // Mobile card view component for each user
  const MobileUserCard = ({ user }) => (
    <div className="card bg-base-100 shadow-md mb-4">
      <div className="card-body p-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-10 h-10 rounded-full">
                <img
                  src={user.profilePic || defaulProfilePic}
                  alt={user.fullName}
                />
              </div>
            </div>
            <div>
              <div className="font-bold">{user.fullName}</div>
              <div className="text-sm opacity-70">@{user.username}</div>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={(e) => toggleDropdown(e, user._id)}
              className="btn btn-sm btn-ghost btn-circle">
              <FaEllipsisV />
            </button>

            {activeDropdown === user._id && (
              <div className="absolute right-0 mt-2 w-48 bg-base-100 shadow-lg rounded-md z-10">
                <ul className="py-2">
                  <li>
                    <button
                      onClick={() =>
                        handleToggleBan(user._id, user.isSuspended)
                      }
                      className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2">
                      {user.isSuspended ? (
                        <FaUnlock className="text-success" />
                      ) : (
                        <FaLock className="text-error" />
                      )}
                      {user.isSuspended ? "Unban User" : "Ban User"}
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => handleDelete(user._id)}
                      className="w-full text-left px-4 py-2 hover:bg-base-200 flex items-center gap-2"
                      disabled={user.role === "admin"}>
                      <FaTrash className="text-error" />
                      Delete User
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <span className="text-xs font-semibold opacity-70">Email:</span>
            <p className="text-sm truncate">{user.email}</p>
          </div>

          <div>
            <span className="text-xs font-semibold opacity-70">Status:</span>
            <span
              className={`badge ml-1 ${
                user.isSuspended ? "badge-error" : "badge-success"
              }`}>
              {user.isSuspended ? "Banned" : "Active"}
            </span>
          </div>
        </div>

        <div className="mt-3">
          <span className="text-xs font-semibold opacity-70">Role:</span>
          <select
            value={user.role}
            onChange={(e) => handleRoleChange(user._id, e.target.value)}
            className="select select-bordered select-sm ml-2"
            disabled={user._id === "currentUserId"}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 md:p-6 bg-base-200 min-h-screen">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6 text-base-content">
        Manage Users
      </h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
        <StatsCard title="Total Users" value={totalUsers} icon={<FaUser />} />
        <StatsCard title="Admins" value={adminCount} icon={<FaUserShield />} />
        <StatsCard title="Regular Users" value={userCount} icon={<FaUser />} />
      </div>

      {/* Search Bar */}
      <div className="mb-4 md:mb-6 flex flex-col sm:flex-row items-center gap-2">
        <div className="relative w-full">
          <FaSearch className="absolute left-3 top-3 text-base-content/50" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search users"
            className="input input-bordered w-full pl-10"
          />
        </div>
        <button
          onClick={fetchUsers}
          className="btn btn-primary w-full sm:w-auto sm:ml-2">
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-md text-primary"></span>
        </div>
      )}

      {/* Desktop Table View - Hidden on Mobile */}
      <div className="hidden md:block overflow-x-auto bg-base-100 rounded-lg shadow">
        <table className="table w-full">
          <thead>
            <tr className="bg-base-200">
              <th className="text-base-content">User</th>
              <th className="text-base-content">Email</th>
              <th className="text-base-content">Role</th>
              <th className="text-base-content">Status</th>
              <th className="text-center text-base-content">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!loading && users.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-8">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover">
                  <td className="flex items-center gap-3">
                    <div className="avatar">
                      <div className="w-10 h-10 rounded-full">
                        <img
                          src={user.profilePic || defaulProfilePic}
                          alt={user.fullName}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="font-bold">{user.fullName}</div>
                      <div className="text-sm opacity-70">@{user.username}</div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user._id, e.target.value)
                      }
                      className="select select-bordered select-sm w-full max-w-xs"
                      disabled={user._id === "currentUserId"}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        user.isSuspended ? "badge-error" : "badge-success"
                      }`}>
                      {user.isSuspended ? "Banned" : "Active"}
                    </span>
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          handleToggleBan(user._id, user.isSuspended)
                        }
                        className={`btn btn-sm btn-circle ${
                          user.isSuspended ? "btn-success" : "btn-error"
                        }`}
                        title={user.isSuspended ? "Unban" : "Ban"}>
                        {user.isSuspended ? <FaUnlock /> : <FaLock />}
                      </button>
                      <button
                        onClick={() => handleDelete(user._id)}
                        className="btn btn-sm btn-error btn-circle"
                        title="Delete"
                        disabled={user.role === "admin"}>
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View - Visible only on Mobile */}
      <div className="md:hidden">
        {!loading && users.length === 0 ? (
          <div className="text-center py-8 bg-base-100 rounded-lg shadow">
            No users found
          </div>
        ) : (
          users.map((user) => <MobileUserCard key={user._id} user={user} />)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="join mt-4 md:mt-6 flex justify-center">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="join-item btn btn-sm md:btn-md btn-primary">
            Previous
          </button>
          <button className="join-item btn btn-sm md:btn-md btn-disabled">
            Page {page} of {totalPages}
          </button>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="join-item btn btn-sm md:btn-md btn-primary">
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
