// ChatContainer.jsx
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/useAuthStore";
import { io } from "socket.io-client";
import ChatHeader from "./ChatHeader";
import MessageInput from "./MessageInput";

const ChatContainer = ({ selectedChat }) => {
  const { user, checkAuth } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const initializeSocket = async () => {
      await checkAuth();
      const token =
        localStorage.getItem("token") ||
        document.cookie.split("jwt=")[1]?.split(";")[0];
      if (!token) {
        console.error("No token available for Socket.IO");
        return;
      }

      const newSocket = io("http://localhost:5001", { auth: { token } });

      newSocket.on("connect", () => {
        console.log("Connected to socket server:", newSocket.id);
        if (selectedChat) newSocket.emit("joinChat", selectedChat);
      });

      newSocket.on("connect_error", (err) => {
        console.error("Socket connection error:", err.message);
      });

      newSocket.on("receiveMessage", (message) => {
        setMessages((prev) => [...prev, message]);
      });

      setSocket(newSocket);

      // Fetch initial messages from Redis (optional)
      const fetchMessages = async () => {
        const keys = await fetch(
          `http://localhost:5001/api/chats/messages/${selectedChat}`
        ).then((res) => res.json());
        const initialMessages = await Promise.all(
          keys.map((key) => fetch(key).then((res) => res.json()))
        );
        setMessages(initialMessages);
      };
      fetchMessages();

      return () => {
        newSocket.disconnect();
      };
    };

    if (selectedChat) initializeSocket();
  }, [selectedChat, checkAuth]);

  const sendMessage = (content) => {
    if (!selectedChat || !user || !socket) return;
    const [userId1, userId2] = selectedChat.split(":");
    const receiverId = userId1 === user._id ? userId2 : userId1;
    const message = {
      chatId: selectedChat,
      content,
      receiverId,
      senderId: user._id,
      timestamp: new Date().toISOString(),
    };
    socket.emit("sendMessage", message);
    setMessages((prev) => [...prev, message]);
  };

  return (
    <div className="flex flex-col h-full">
      <ChatHeader />
      <div className="flex-1 overflow-y-auto p-4 bg-base-100">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat ${
              msg.userId === user._id ? "chat-end" : "chat-start"
            }`}>
            <div className="chat-bubble">{msg.content}</div>
          </div>
        ))}
      </div>
      <MessageInput onSend={sendMessage} />
    </div>
  );
};

export default ChatContainer;
