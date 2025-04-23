// hooks/useSocket.hook.js
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { useAuthStore } from "../store/useAuthStore";

const SOCKET_URL =
  import.meta.env.VITE_API_URL || "https://sociofy-backend.onrender.com";

export const useSocket = (initializeListeners = () => {}) => {
  const [socket, setSocket] = useState(null);
  const socketRef = useRef(null);
  const { authUser, token, checkAuth, isCheckingAuth } = useAuthStore();
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const initializeSocket = async () => {
      if (isCheckingAuth) {
        console.log("useSocket - Waiting for auth check...");
        return;
      }

      if (!authUser || !token) {
        console.log("useSocket - No authUser or token, triggering checkAuth:", {
          authUser: !!authUser,
          token: !!token,
        });
        await checkAuth();
        return;
      }

      if (socketRef.current && socketRef.current.connected) {
        console.log(
          "useSocket - Reusing existing socket:",
          socketRef.current.id
        );
        setSocket(socketRef.current);
        return;
      }

      console.log("useSocket - Initializing socket with token:", token);
      const socketInstance = io(SOCKET_URL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        withCredentials: true,
        transports: ["websocket"],
      });

      socketInstance.on("connect", () => {
        console.log("useSocket - Socket connected:", socketInstance.id);
        socketInstance.emit("join", authUser._id);
        if (isMounted.current) {
          setSocket(socketInstance);
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("useSocket - Socket connection error:", error.message);
        if (error.message.includes("Authentication error")) {
          console.log("useSocket - Invalid token, triggering checkAuth");
          checkAuth();
        }
      });

      socketInstance.on("disconnect", (reason) => {
        console.log("useSocket - Socket disconnected:", reason);
        if (isMounted.current) {
          setSocket(null);
        }
      });

      socketRef.current = socketInstance;
      initializeListeners(socketInstance);
    };

    initializeSocket();

    return () => {
      isMounted.current = false;
      console.log("useSocket - Socket cleanup on unmount");
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
      }
    };
  }, [authUser, token, checkAuth, isCheckingAuth]);

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
