import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useInitializeSettings } from "./store/useSettingsStore";
import { useSyncSidebar } from "./store/useSidebarStore";
import { useSyncProfile } from "./store/useProfileStore";
import { useSyncFollow, useFollowStore } from "./store/useFollowStore";
import { useSyncPosts, usePostStore } from "./store/usePostStore";
import { useSyncCreatePost } from "./store/useCreatePostStore";
import { useSocket } from "./hooks/useSocket.hook";
import { useLocation, useNavigate } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import { Loader } from "lucide-react";
import Sidebar from "./components/Sidebar";
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import MessagesPage from "./pages/MessagePage";
import FollowersPage from "./pages/FollowersPage";
import CreatePost from "./modal/CreatePost";
import PostPage from "./pages/PostPage";
import NotificationsPage from "./pages/NotificationPage";
import TopBar from "./components/TopBar";
import StatusBar from "./components/StatusBar";
import AdminDashboard from "./components/admin/AdminDashboard";
import AdminLayout from "./components/admin/AdminLayout";
import ManageNotifications from "./components/admin/ManageNotifications";
import ManagePosts from "./components/admin/ManagePosts";
import ManageUsers from "./components/admin/ManageUsers";
import AdminSettings from "./components/admin/AdminSettings";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";
import Chatbot from "./components/Chatbot";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const initializeSocketListeners = (socket) => {
    if (!socket) return;
    useFollowStore.getState().initializeSocket(socket);
    usePostStore.getState().initializeSocket(socket);
  };

  const socket = useSocket(initializeSocketListeners);

  useInitializeSettings();
  useSyncSidebar();
  useSyncProfile();
  useSyncFollow();
  useSyncPosts();
  useSyncCreatePost();

  useEffect(() => {
    sessionStorage.setItem("lastRoute", location.pathname);
  }, [location]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (isCheckingAuth) return;

    const publicRoutes = ["/login", "/signup"];
    const isShareRoute = /^\/s\/[^/]+$/.test(location.pathname);
    const isPostRoute = /^\/post\/[^/]+$/.test(location.pathname);
    const adminRoutes = [
      "/admin/dashboard",
      "/admin/notifications",
      "/admin/posts",
      "/admin/users",
      "/admin/settings",
    ];

    const isPublicRoute =
      publicRoutes.includes(location.pathname) || isShareRoute || isPostRoute;

    if (!authUser && !isPublicRoute) {
      navigate("/login", { replace: true });
    } else if (authUser) {
      if (location.pathname === "/login" || location.pathname === "/signup") {
        navigate(authUser.role === "admin" ? "/admin/dashboard" : "/", {
          replace: true,
        });
      } else if (
        authUser.role === "admin" &&
        !adminRoutes.includes(location.pathname) &&
        !isPublicRoute
      ) {
        toast.error("Access denied. Redirecting to admin dashboard.");
        navigate("/admin/dashboard", { replace: true });
      } else if (
        authUser.role === "user" &&
        adminRoutes.includes(location.pathname)
      ) {
        toast.error("Access denied. Redirecting to home.");
        navigate("/", { replace: true });
      }
    }
  }, [authUser, isCheckingAuth, location.pathname, navigate]);

  const preventTextSelection = (e) => {
    const isStaticText = !e.target.closest(
      "input, textarea, button, a, [contenteditable]"
    );
    if (isStaticText) {
      e.preventDefault();
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );
  }

  const isCreatePostOpen = location.pathname === "/create-post";

  return (
    <div
      className="flex flex-col h-screen w-full static-text"
      onMouseDown={preventTextSelection}>
      <div className="flex flex-1 overflow-hidden">
        {authUser && authUser.role === "user" && (
          <Sidebar className="hidden md:block" />
        )}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <Routes>
            <Route
              path="/"
              element={
                authUser && authUser.role === "user" ? (
                  <HomePage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route path="/signup" element={<SignUpPage />} />
            <Route
              path="/login"
              element={
                !authUser ? (
                  <LoginPage />
                ) : (
                  <Navigate
                    to={authUser.role === "admin" ? "/admin/dashboard" : "/"}
                  />
                )
              }
            />
            <Route
              path="/profile/:username"
              element={
                authUser && authUser.role === "user" ? (
                  <ProfilePage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route
              path="/profile/:username/followers"
              element={
                authUser && authUser.role === "user" ? (
                  <ProfilePage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route
              path="/profile/:username/following"
              element={
                authUser && authUser.role === "user" ? (
                  <ProfilePage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route path="/s/:shortCode" element={<PostPage />} />
            <Route path="/post/:postId" element={<PostPage />} />
            <Route
              path="/messages"
              element={
                authUser && authUser.role === "user" ? (
                  <MessagesPage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route
              path="/friends"
              element={
                authUser && authUser.role === "user" ? (
                  <FollowersPage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route
              path="/notifications"
              element={
                authUser && authUser.role === "user" ? (
                  <NotificationsPage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route
              path="/settings"
              element={
                authUser && authUser.role === "user" ? (
                  <SettingsPage />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route
              path="/support/chat"
              element={
                authUser && authUser.role === "user" ? (
                  <Chatbot />
                ) : (
                  <Navigate
                    to={
                      authUser?.role === "admin" ? "/admin/dashboard" : "/login"
                    }
                  />
                )
              }
            />
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="notifications" element={<ManageNotifications />} />
                <Route path="posts" element={<ManagePosts />} />
                <Route path="users" element={<ManageUsers />} />
                <Route path="settings" element={<AdminSettings />} />
              </Route>
            </Route>
          </Routes>
          {authUser && authUser.role === "user" && <StatusBar />}
        </div>
      </div>
      {authUser && isCreatePostOpen && (
        <CreatePost isOpen={true} onClose={() => navigate("/")} />
      )}
      <Toaster />
    </div>
  );
};

export default App;
