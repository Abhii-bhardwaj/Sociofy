import { create } from "zustand";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import emitter from "../lib/eventEmitter";

export const useAuthStore = create((set) => ({
  authUser: JSON.parse(localStorage.getItem("authUser")) || null,
  setAuthUser: (user) => {
    localStorage.setItem("authUser", JSON.stringify(user));
    set({ authUser: user });
    emitter.emit("USER_UPDATED", user);
  },
  isSigningUp: false,
  isLoggingIn: false,
  isCheckingAuth: true,
  token: localStorage.getItem("token") || null,
  error: null,

  checkAuth: async () => {
    try {
      const { data } = await axiosInstance.get("/auth/check");
      const tokenFromCookie = document.cookie.split("jwt=")[1]?.split(";")[0];

      if (tokenFromCookie) {
        localStorage.setItem("token", tokenFromCookie);
        console.log(
          "checkAuth - Token refreshed from cookie:",
          tokenFromCookie
        );
      } else if (data.token) {
        localStorage.setItem("token", data.token);
        console.log("checkAuth - Token set from response:", data.token);
      } else {
        console.error("checkAuth - No token found in response or cookie");
      }

      set({
        authUser: data.user || data,
        isCheckingAuth: false,
      });
      localStorage.setItem("authUser", JSON.stringify(data.user || data));
      emitter.emit("USER_UPDATED", data.user || data);
    } catch (error) {
      console.error("checkAuth - User not authenticated:", error.message);
      set({ authUser: null, isCheckingAuth: false });
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

  login: async (data) => {
    set({ isLoggingIn: true, error: null });
    try {
      const response = await axiosInstance.post("/auth/login", data);
      if (response.status === 200) {
        const token =
          response.data.token ||
          document.cookie.split("jwt=")[1]?.split(";")[0];
        console.log("login - Fetched token:", token);
        if (token) {
          localStorage.setItem("token", token);
          console.log(
            "login - Token set in localStorage:",
            localStorage.getItem("token")
          );
        } else {
          console.error("login - No token found in response or cookie");
        }
        set({ authUser: { ...response.data, role: response.data.role } });
        localStorage.setItem(
          "authUser",
          JSON.stringify({ ...response.data, role: response.data.role })
        );
        toast.success("Logged in successfully");
        emitter.emit("USER_UPDATED", {
          ...response.data,
          role: response.data.role,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.get("/auth/logout");
      localStorage.removeItem("authUser");
      localStorage.removeItem("token");
      set({ authUser: null });
      document.cookie = `jwt=; expires=${new Date(0).toUTCString()}; path=/;`;
      emitter.emit("USER_UPDATED", null);
      window.location.reload();
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
