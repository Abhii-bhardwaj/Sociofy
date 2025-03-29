import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "./store/useAuthStore";
import { useLocation, useNavigate } from "react-router-dom";

import { Loader } from "lucide-react";

// React Pages
import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import MessagesPage from "./pages/MessagePage";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();

  // Rebuild browser history on app load/refresh
  useEffect(() => {
    const historyStack = JSON.parse(sessionStorage.getItem("history")) || [];
    if (historyStack.length > 0) {
      // Clear current browser history to avoid duplicates
      window.history.replaceState(null, "", historyStack[0]);

      // Rebuild browser history from sessionStorage
      for (let i = 1; i < historyStack.length; i++) {
        window.history.pushState({ idx: i }, "", historyStack[i]);
      }

      // Navigate to the last route
      const lastRoute = sessionStorage.getItem("lastRoute");
      if (lastRoute && lastRoute !== location.pathname + location.search) {
        navigate(lastRoute, { replace: true });
      }
    }
  }, []);

  // Update history stack on route change
  useEffect(() => {
    const currentRoute = location.pathname + location.search;
    sessionStorage.setItem("lastRoute", currentRoute);

    const history = JSON.parse(sessionStorage.getItem("history")) || [];
    if (history.length === 0 || history[history.length - 1] !== currentRoute) {
      history.push(currentRoute);
      sessionStorage.setItem("history", JSON.stringify(history));
      // Push to browser history
      window.history.pushState({ idx: history.length - 1 }, "", currentRoute);
    }
  }, [location]);

  // Handle browser back/forward globally
  useEffect(() => {
    const handlePopState = (event) => {
      const history = JSON.parse(sessionStorage.getItem("history")) || [];
      const currentIdx = event.state?.idx ?? history.length - 1;
      const targetRoute = history[currentIdx];

      if (targetRoute) {
        console.log("Navigating to:", targetRoute);
        navigate(targetRoute, { replace: true });
      } else {
        // Fallback to home if no route found
        navigate("/", { replace: true });
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const storedRoute = sessionStorage.getItem("lastRoute");
    if (storedRoute && !authUser) navigate(storedRoute);
  }, [authUser]);

  if (isCheckingAuth)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" />}
        />
        <Route
          path="/profile/:userId"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/messages"
          element={authUser ? <MessagesPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/settings"
          element={authUser ? <SettingsPage /> : <Navigate to="/login" />}
        />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
