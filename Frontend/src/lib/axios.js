import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_REACT_APP_API_URL || "http://localhost:5000",
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

// Add response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("Response headers:", response.headers); // Debug cookies
    return response;
  },
  (error) => {
    console.error("Axios error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);