// hooks/useSocket.js
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export const useSocket = (initializeListeners = () => {}) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const { authUser, token, checkAuth, isCheckingAuth } = useAuthStore();
  const isMounted = useRef(false); // Track if component is mounted

  useEffect(() => {
    isMounted.current = true; // Mark as mounted

    if (isCheckingAuth) {
      console.log("useSocket: Waiting for auth check...");
      return;
    }

    if (!authUser || !token) {
      console.log("useSocket: No authUser or token, triggering checkAuth");
      checkAuth();
      return;
    }

    // If socket already exists and is connected, reuse it
    if (socketRef.current && socketRef.current.connected) {
      console.log("Reusing existing socket:", socketRef.current.id);
      setSocket(socketRef.current);
      return;
    }

    // Initialize socket only once
    const socketInstance = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` }, // Explicit Bearer token
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      withCredentials: true,
      transports: ["websocket", "polling"], // Fallback to polling if WebSocket fails
    });

    socketInstance.on("connect", () => {
      // console.log("Socket connected:", socketInstance.id);
      socketInstance.emit("join", authUser._id);
      if (isMounted.current) {
        setSocket(socketInstance);
      }
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      if (!token) {
        checkAuth();
      }
    });

    socketInstance.on("disconnect", (reason) => {
      // console.log("Socket disconnected:", reason);
      if (isMounted.current) {
        setSocket(null);
      }
    });

    socketRef.current = socketInstance;
    initializeListeners(socketInstance);

    // Cleanup only on true unmount
    return () => {
      isMounted.current = false;
      // console.log("Socket cleanup on unmount");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [authUser, token, checkAuth, isCheckingAuth]); // Removed initializeListeners from deps

  // Detach listeners from dependency to avoid re-runs
  useEffect(() => {
    if (socketRef.current) {
      initializeListeners(socketRef.current);
    }
  }, [initializeListeners]);

  return {
    socket,
    connected: socket?.connected || false,
  };
};
