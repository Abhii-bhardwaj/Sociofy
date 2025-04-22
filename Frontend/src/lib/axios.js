import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: `VITE_APP_URL` || "http://localhost:5000",
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
