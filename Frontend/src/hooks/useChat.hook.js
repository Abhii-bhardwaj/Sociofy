import { useState, useEffect, useCallback, useRef } from "react";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "../store/useAuthStore";
import { useSocket } from "./useSocket.hook";

// Helper to decode JWT (unchanged)
const getUserIdFromToken = (token) => {
  if (!token) return null;
  try {
    if (token.split(".").length !== 3) {
      console.error("Invalid token format:", token);
      return null;
    }
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.userId;
  } catch (e) {
    console.error("Failed to decode token:", e);
    return null;
  }
};

const useChat = () => {
  console.log("--- useChat Hook Executing ---");

  const { authUser, token, checkAuth } = useAuthStore();
  const currentUserId = authUser?._id || null; // Directly use authUser._id


  const [chatList, setChatList] = useState([]);
  const [messages, setMessages] = useState({});
  const [activeChatId, setActiveChatId] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const messagesRef = useRef(messages);
  const chatListRef = useRef(chatList);
  const activeChatIdRef = useRef(activeChatId);

  useEffect(() => {
    messagesRef.current = messages;
    chatListRef.current = chatList;
    activeChatIdRef.current = activeChatId;
  }, [messages, chatList, activeChatId]);

  const { socket, connected } = useSocket();

const updateChatListOptimistically = useCallback(
  (message, isActiveChat = false) => {
    if (!currentUserId) return;

    const partnerId =
      message.senderId === currentUserId
        ? message.receiverId
        : message.senderId;

    setChatList((prevList) => {
      const list = [...prevList];
      const chatIndex = list.findIndex((chat) => chat.id === partnerId);

      let updatedChatEntry;

      if (chatIndex !== -1) {
        updatedChatEntry = {
          ...list[chatIndex],
          lastMessage: message.isDeleted ? "Message deleted" : message.content,
          lastMessageTimestamp: message.createdAt,
          lastMessageType: message.contentType,
          unreadCount:
            message.receiverId === currentUserId &&
            !isActiveChat &&
            !message.isRead
              ? (list[chatIndex].unreadCount || 0) + 1
              : list[chatIndex].unreadCount,
        };
        list.splice(chatIndex, 1);
        list.unshift(updatedChatEntry);
      } else if (!message.isDeleted) {
        console.warn("New chat detected, partner info might be missing.");
        updatedChatEntry = {
          id: partnerId,
          name: "Loading...",
          profilePic: "",
          lastMessage: message.content,
          lastMessageTimestamp: message.createdAt,
          lastMessageType: message.contentType,
          unreadCount:
            message.receiverId === currentUserId && !isActiveChat ? 1 : 0,
          isTyping: false,
          online: false,
        };
        list.unshift(updatedChatEntry);
      }
      return list;
    });
  },
  [currentUserId]
);

const fetchChatList = useCallback(async () => {
  if (!token || !currentUserId) {
    console.log("No token or currentUserId, skipping fetchChatList");
    setLoadingInitial(false);
    return;
  }
  console.log("Fetching chat list with token:", token);
  setLoadingInitial(true);
  try {
    const response = await axiosInstance.get("/messages/list", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Chat list fetched:", response.data);
    const onlineUsers = await axiosInstance.get("/messages/online", {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Online users fetched:", onlineUsers.data);
    const onlineUserIds = new Set(onlineUsers.data.map((user) => user._id));
    const sortedList = response.data
      .map((chat) => ({
        ...chat,
        online: onlineUserIds.has(chat.id),
      }))
      .sort((a, b) => {
        if (!a.lastMessageTimestamp) return 1;
        if (!b.lastMessageTimestamp) return -1;
        return (
          new Date(b.lastMessageTimestamp) - new Date(a.lastMessageTimestamp)
        );
      });
    setChatList(sortedList);
  } catch (error) {
    console.error("Failed to fetch chat list:", error.response || error);
  } finally {
    setLoadingInitial(false);
  }
}, [token, currentUserId]);

const loadSuggestions = useCallback(async () => {
    if (!token || !currentUserId) {
      console.log("No token or currentUserId, skipping loadSuggestions");
      setLoadingSuggestions(false);
      return;
    }
    console.log("Fetching suggestions with token:", token);
    setLoadingSuggestions(true);
    try {
      const response = await axiosInstance.get("/messages/suggestions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Suggestions fetched:", response.data);
      const onlineUsers = await axiosInstance.get("/messages/online", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const onlineUserIds = new Set(onlineUsers.data.map((user) => user._id));
      const updatedSuggestions = response.data.map((suggestion) => ({
        ...suggestion,
        online: onlineUserIds.has(suggestion._id),
      }));
      setSuggestions(updatedSuggestions);
    } catch (error) {
      console.error("Failed to fetch suggestions:", error.response || error);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [token, currentUserId]);

  const handleIncomingMessage = useCallback(
    (message) => {
      console.log("New message received:", message);
      if (!message || !message.senderId || !currentUserId) {
        console.error(
          "Received invalid message object or no currentUserId:",
          message
        );
        return;
      }
      const chatId =
        message.senderId === currentUserId
          ? message.receiverId
          : message.senderId;

      setMessages((prev) => {
        const currentChatMessages = prev[chatId] || [];
        const existingIndex = currentChatMessages.findIndex(
          (msg) =>
            msg._id === message._id ||
            (msg._id.startsWith("temp_") && msg.content === message.content)
        );

        if (existingIndex !== -1) {
          const updatedMessages = [...currentChatMessages];
          updatedMessages[existingIndex] = { ...message };
          return {
            ...prev,
            [chatId]: updatedMessages,
          };
        }

        return {
          ...prev,
          [chatId]: [...currentChatMessages, message],
        };
      });

      updateChatListOptimistically(message, chatId === activeChatIdRef.current);

      if (
        message.receiverId === currentUserId &&
        chatId === activeChatIdRef.current
      ) {
        console.log(`Auto marking message ${message._id} as read`);
        socket.emit("mark_as_read", {
          messageId: message._id,
          senderId: message.senderId,
        });
        setMessages((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map((msg) =>
            msg._id === message._id
              ? { ...msg, isRead: true, deliveryStatus: "read" }
              : msg
          ),
        }));
        setChatList((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      }
    },
    [currentUserId, updateChatListOptimistically, socket]
  );

  const handleMessageStatusUpdate = useCallback(
    (status) => (data) => {
      const { messageId, chatId } = data;
      if (!messageId || !chatId) return;
      console.log(`Message status update (${status}):`, data);

      setMessages((prev) => {
        const chatMessages = prev[chatId];
        if (!chatMessages) return prev;

        return {
          ...prev,
          [chatId]: chatMessages.map((msg) => {
            if (msg._id === messageId) {
              const currentStatus = msg.deliveryStatus;
              const newStatus = status;
              const precedence = {
                sending: 0,
                sent: 1,
                delivered: 2,
                read: 3,
                failed: 0,
              };
              if (precedence[newStatus] >= precedence[currentStatus]) {
                const updatedFields = { deliveryStatus: newStatus };
                if (newStatus === "read") {
                  updatedFields.isRead = true;
                }
                return { ...msg, ...updatedFields };
              }
            }
            return msg;
          }),
        };
      });

      if (status === "read" && chatId === activeChatIdRef.current) {
        setChatList((prev) =>
          prev.map((chat) =>
            chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
          )
        );
      }
    },
    []
  );

  const handleDelivered = handleMessageStatusUpdate("delivered");
  const handleRead = handleMessageStatusUpdate("read");

  const handleMessageDeleted = useCallback((data) => {
    const { messageId, chatId } = data;
    if (!messageId || !chatId) return;
    console.log("Message deleted event received:", data);

    setMessages((prev) => {
      const chatMessages = prev[chatId];
      if (!chatMessages) return prev;
      return {
        ...prev,
        [chatId]: chatMessages.map((msg) =>
          msg._id === messageId
            ? {
                ...msg,
                isDeleted: true,
                content: "This message was deleted",
                contentType: "deleted",
              }
            : msg
        ),
      };
    });
  }, []);

  const handleUserTyping = useCallback(({ userId }) => {
    console.log(`User ${userId} is typing`);
    setTypingUsers((prev) => ({ ...prev, [userId]: true }));
    setChatList((prev) =>
      prev.map((c) => (c.id === userId ? { ...c, isTyping: true } : c))
    );
  }, []);

  const handleUserStopTyping = useCallback(({ userId }) => {
    console.log(`User ${userId} stopped typing`);
    setTypingUsers((prev) => ({ ...prev, [userId]: false }));
    setChatList((prev) =>
      prev.map((c) => (c.id === userId ? { ...c, isTyping: false } : c))
    );
  }, []);

  const handleUserOnline = useCallback((data) => {
    const userId = data.userId;
    console.log(`User online event received: ${userId}`);
    setChatList((prev) =>
      prev.map((c) => (c.id === userId ? { ...c, online: true } : c))
    );
    setSuggestions((prev) =>
      prev.map((s) => (s._id === userId ? { ...s, online: true } : s))
    );
  }, []);

  const handleUserOffline = useCallback((data) => {
    const userId = data.userId;
    console.log(`User offline event received: ${userId}`);
    setChatList((prev) =>
      prev.map((c) =>
        c.id === userId ? { ...c, online: false, isTyping: false } : c
      )
    );
    setSuggestions((prev) =>
      prev.map((s) => (s._id === userId ? { ...s, online: false } : s))
    );
    setTypingUsers((prev) => ({ ...prev, [userId]: false }));
  }, []);

  const markMessagesAsRead = useCallback(
    (chatId) => {
      if (
        !socket ||
        !connected ||
        !chatId ||
        chatId !== activeChatIdRef.current ||
        !currentUserId
      )
        return;

      const chatMessages = messagesRef.current[chatId] || [];
      const unreadMessages = chatMessages.filter(
        (msg) => !msg.isRead && msg.receiverId === currentUserId
      );

      if (unreadMessages.length === 0) return;

      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((msg) =>
          !msg.isRead && msg.receiverId === currentUserId
            ? { ...msg, isRead: true, deliveryStatus: "read" }
            : msg
        ),
      }));

      setChatList((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
        )
      );

      unreadMessages.forEach((msg) => {
        console.log(`Emitting mark_as_read for message ${msg._id}`);
        socket.emit("mark_as_read", {
          messageId: msg._id,
          senderId: msg.senderId,
        });
      });
    },
    [socket, connected, currentUserId]
  );

  const fetchMessages = useCallback(
    async (chatId) => {
      if (!token || !chatId) {
        console.log("Missing token or chatId, skipping fetchMessages");
        return;
      }
      console.log(`Fetching messages for chat ${chatId} with token: ${token}`);
      setLoadingMessages(true);
      try {
        const response = await axiosInstance.get(
          `/messages/messages/${chatId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log(`Messages fetched for chat ${chatId}:`, response.data);
        setMessages((prev) => ({ ...prev, [chatId]: response.data }));
        markMessagesAsRead(chatId);
      } catch (error) {
        console.error(`Failed to fetch messages for chat ${chatId}:`, error);
      } finally {
        setLoadingMessages(false);
      }
    },
    [token, markMessagesAsRead]
  );

  const sendMessage = useCallback(
    (receiverId, content, contentType = "text") => {
      if (
        !socket ||
        !connected ||
        !content.trim() ||
        !receiverId ||
        !currentUserId
      ) {
        console.log("Cannot send message, missing dependencies:", {
          socket: !!socket,
          connected,
          contentValid: !!content.trim(),
          receiverId: !!receiverId,
          currentUserId: !!currentUserId,
        });
        return;
      }

      const tempId = `temp_${Date.now()}`;
      const messageData = {
        _id: tempId,
        senderId: currentUserId,
        receiverId,
        content,
        contentType,
        createdAt: new Date().toISOString(),
        deliveryStatus: "sending",
        isRead: false,
        isDeleted: false,
      };

      console.log("Sending message:", messageData);

      setMessages((prev) => ({
        ...prev,
        [receiverId]: [...(prev[receiverId] || []), messageData],
      }));

      updateChatListOptimistically(messageData);

      socket.emit(
        "direct_message",
        { receiverId, content, contentType, tempId },
        (response) => {
          console.log("Message send acknowledgement received:", response);
          if (response.success && response.message) {
            setMessages((prev) => {
              const chatMessages = prev[receiverId] || [];
              const updatedMessages = chatMessages.map((msg) =>
                msg._id === tempId
                  ? {
                      ...response.message,
                      deliveryStatus: response.message.deliveryStatus || "sent",
                    }
                  : msg
              );
              return {
                ...prev,
                [receiverId]: updatedMessages,
              };
            });
          } else {
            console.error("Message failed to send:", response?.error);
            setMessages((prev) => {
              const chatMessages = prev[receiverId] || [];
              return {
                ...prev,
                [receiverId]: chatMessages.map((msg) =>
                  msg._id === tempId
                    ? { ...msg, deliveryStatus: "failed" }
                    : msg
                ),
              };
            });
          }
        }
      );
    },
    [socket, connected, currentUserId, updateChatListOptimistically]
  );

  const deleteMessage = useCallback(
    async (messageId, chatId) => {
      if (!token || !messageId || !chatId) return;

      let originalMessage = null;
      messagesRef.current[chatId]?.forEach((msg) => {
        if (msg._id === messageId) originalMessage = { ...msg };
      });

      setMessages((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).map((msg) =>
          msg._id === messageId
            ? { ...msg, content: "Deleting...", isDeleting: true }
            : msg
        ),
      }));

      try {
        await axiosInstance.delete(`/messages/${messageId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (error) {
        console.error("Failed to delete message:", error);
        if (originalMessage) {
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).map((msg) =>
              msg._id === messageId ? originalMessage : msg
            ),
          }));
        } else {
          setMessages((prev) => ({
            ...prev,
            [chatId]: (prev[chatId] || []).filter(
              (msg) => msg._id !== messageId
            ),
          }));
        }
      }
    },
    [token]
  );

  const sendTyping = useCallback(
    (receiverId, isTyping) => {
      if (!socket || !connected || !receiverId) return;
      const event = isTyping ? "typing" : "stop_typing";
      socket.emit(event, { receiverId });
    },
    [socket, connected]
  );

  useEffect(() => {
    if (!socket) return;

    const initializeSocketListeners = () => {
      socket.off("new_message");
      socket.off("message_delivered");
      socket.off("message_read");
      socket.off("message_deleted");
      socket.off("user_typing");
      socket.off("user_stop_typing");
      socket.off("user_online");
      socket.off("user_offline");

      socket.on("new_message", handleIncomingMessage);
      socket.on("message_delivered", handleDelivered);
      socket.on("message_read", handleRead);
      socket.on("message_deleted", handleMessageDeleted);
      socket.on("user_typing", handleUserTyping);
      socket.on("user_stop_typing", handleUserStopTyping);
      socket.on("user_online", handleUserOnline);
      socket.on("user_offline", handleUserOffline);

      console.log("Socket listeners initialized successfully");
    };

    initializeSocketListeners();

    return () => {
      socket.off("new_message", handleIncomingMessage);
      socket.off("message_delivered", handleDelivered);
      socket.off("message_read", handleRead);
      socket.off("message_deleted", handleMessageDeleted);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
    };
  }, [
    socket,
    handleIncomingMessage,
    handleDelivered,
    handleRead,
    handleMessageDeleted,
    handleUserTyping,
    handleUserStopTyping,
    handleUserOnline,
    handleUserOffline,
  ]);

useEffect(() => {
  console.log("useEffect for initial fetch - Conditions:", {
    token: !!token,
    userId: currentUserId,
    connected: connected,
  });

  const initializeChat = async () => {
    if (!token && currentUserId) {
      console.log("No token, triggering checkAuth");
      await checkAuth();
      return;
    }

    if (token && currentUserId && connected) {
      console.log(
        "All conditions met, triggering fetchChatList and loadSuggestions"
      );
      fetchChatList();
      loadSuggestions();
    } else {
      console.log("Some conditions not met, skipping initial fetch");
      setLoadingInitial(false);
      setLoadingSuggestions(false);
    }
  };

  initializeChat();
}, [
  token,
  currentUserId,
  connected,
  fetchChatList,
  loadSuggestions,
  checkAuth,
]);

  useEffect(() => {
    if (activeChatId && connected && socket) {
      const chatId = activeChatId;
      socket.emit("chat_active", { chatId });
      markMessagesAsRead(chatId);
    }
  }, [activeChatId, connected, socket, markMessagesAsRead]);

  useEffect(() => {
    console.log("Token updated in useChat:", token);
  }, [token]);

  return {
    socket,
    connected,
    chatList,
    messages,
    activeChatId,
    loadingInitial,
    loadingMessages,
    typingUsers,
    suggestions,
    loadingSuggestions,
    setActiveChatId,
    fetchMessages,
    sendMessage,
    deleteMessage,
    sendTyping,
    loadSuggestions,
    currentUserId,
  };
};

export default useChat;
