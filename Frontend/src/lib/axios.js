import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const axiosInstance = axios.create({
  baseURL: process.env.VITE_API_URL || "http://localhost:5000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Token ko header mein bhej sakte ho
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
