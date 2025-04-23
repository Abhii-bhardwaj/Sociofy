import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import emitter from "../lib/eventEmitter";

export const useAuthStore = create((set) => ({
  authUser: JSON.parse(localStorage.getItem("authUser")) || null,
  token: localStorage.getItem("token") || null,
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  error: null,

  setAuthUser: (user, token) => {
    console.log("setAuthUser - Setting user and token:", { user, token });
    localStorage.setItem("authUser", JSON.stringify(user));
    localStorage.setItem("token", token);
    set({ authUser: user, token });
    emitter.emit("USER_UPDATED", user);
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true });
    try {
      const response = await axiosInstance.get("/auth/check", {
        withCredentials: true,
      });
      const { data } = response;

      // Fetch token from cookie, response, or localStorage
      let token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("jwt="))
        ?.split("=")[1];

      if (!token && data.token) {
        token = data.token;
      }
      if (!token) {
        token = localStorage.getItem("token");
      }

      if (!token) {
        throw new Error("No token found in cookie, response, or localStorage");
      }

      console.log("checkAuth - Token fetched:", token);
      localStorage.setItem("token", token);
      localStorage.setItem("authUser", JSON.stringify(data.user || data));

      set({
        authUser: data.user || data,
        token,
        isCheckingAuth: false,
      });
      emitter.emit("USER_UPDATED", data.user || data);
    } catch (error) {
      console.error("checkAuth - Authentication failed:", error.message);
      localStorage.removeItem("token");
      localStorage.removeItem("authUser");
      set({ authUser: null, token: null, isCheckingAuth: false });
      emitter.emit("USER_UPDATED", null);
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/signup", data, {
        withCredentials: true,
      });
      const token = response.data.token;
      console.log("Signup - Token from response:", token);

      if (token) {
        localStorage.setItem("token", token);
        set({
          authUser: { ...response.data.user, role: response.data.user.role },
        });
        localStorage.setItem(
          "authUser",
          JSON.stringify({
            ...response.data.user,
            role: response.data.user.role,
          })
        );
        toast.success("Account created successfully");
        emitter.emit("USER_UPDATED", {
          ...response.data.user,
          role: response.data.user.role,
        });
      } else {
        throw new Error("No token received in signup response");
      }
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Signup failed";
      toast.error(errorMsg);
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (email, password) => {
    set({ isLoggingIn: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });
      const { data } = response;
      console.log("login - Token from response:", data.token);

      if (!data.token) {
        throw new Error("No token received in login response");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("authUser", JSON.stringify(data.user));
      set({
        authUser: data.user,
        token: data.token,
        isLoggingIn: false,
      });
      emitter.emit("USER_UPDATED", data.user);
      toast.success("Logged in successfully");
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      set({ isLoggingIn: false, error: message });
      toast.error(message);
      throw error;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.get("/auth/logout", { withCredentials: true });
      localStorage.removeItem("authUser");
      localStorage.removeItem("token");
      // Clear sessionStorage to prevent lastRoute restoration
      sessionStorage.removeItem("lastRoute");
      set({ authUser: null, token: null });
      document.cookie = `jwt=; expires=${new Date(
        0
      ).toUTCString()}; path=/; sameSite=None; secure`;
      emitter.emit("USER_UPDATED", null);
      // Redirect to login instead of reload
      window.location.href = "/login";
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Logout failed";
      toast.error(errorMsg);
    }
  },

  sendOtp: async (email) => {
    set({ isSigningUp: true, error: null });
    try {
      const res = await axiosInstance.post("/auth/send-otp", { email });
      if (res.status === 200) {
        set({ isOtpSent: true });
        toast.success("OTP sent successfully. Please check your email.");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Failed to send OTP";
      toast.error(errorMsg);
      set({ error: errorMsg });
    } finally {
      set({ isSigningUp: false });
    }
  },

  verifyOtp: async (email, otp) => {
    set({ isSigningUp: true, error: null });
    try {
      const res = await axiosInstance.post("/auth/verify-otp", { email, otp });
      if (res.status === 200) {
        set({ isOtpVerified: true });
        console.log("OTP verified successfully");
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Invalid OTP";
      toast.error(errorMsg);
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  checkUsername: async (username) => {
    if (!username || username.trim() === "")
      return { available: false, message: "" };
    try {
      const response = await axiosInstance.get(
        `/auth/check-username?username=${username}`
      );
      return response.data;
    } catch (error) {
      console.error("Error checking username:", error);
      return { available: false, message: "Error checking username" };
    }
  },

  generateUsernameSuggestion: async (fullName) => {
    if (!fullName) return "";
    const base = fullName
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("");
    const generateRandomSuffix = () => {
      const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
      let suffix = "";
      for (let i = 0; i < 4; i++) {
        suffix += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }
      return suffix;
    };
    let suggestion = base;
    while (true) {
      const response = await axiosInstance.get(
        `/auth/check-username?username=${suggestion}`
      );
      if (response.data.available) break;
      suggestion = `${base}${generateRandomSuffix()}`;
    }
    return suggestion;
  },
}));
