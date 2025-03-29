// MessagesPage.jsx
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router-dom";
import ChatContainer from "../components/chat/ChatContainer";
import axios from "axios";

const MessagesPage = () => {
  const { user, checkAuth, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    const verifyAuth = async () => {
      if (!user && !isLoading) {
        await checkAuth();
        const updatedUser = useAuthStore.getState().authUser;
        if (!updatedUser) {
          console.log("No user found after checkAuth, redirecting to login");
          navigate("/login");
        }
      }
    };
    verifyAuth();
  }, [user, isLoading, checkAuth, navigate]);

  useEffect(() => {
    const fetchChatList = async () => {
      try {
        const { data } = await axios.get(
          "http://localhost:5001/api/chats/list",
          {
            withCredentials: true, // For cookies
          }
        );
        setChats(data);
      } catch (error) {
        console.error("Error fetching chatlist:", error);
      }
    };

    if (user) fetchChatList();
  }, [user]);

  if (isLoading) {
    return <div className="p-4 text-base-content">Loading...</div>;
  }

  return (
    <div className="h-screen bg-base-100 flex">
      <div className="w-1/4 border-r border-base-300 p-4 overflow-y-auto">
        <h2 className="text-xl font-bold text-base-content mb-4">Chats</h2>
        {chats.map((chat) => (
          <div
            key={chat.id}
            className={`p-2 rounded cursor-pointer flex items-center gap-2 ${
              selectedChat === chat.id ? "bg-base-300" : "hover:bg-base-200"
            }`}
            onClick={() => setSelectedChat(chat.id)}>
            <img
              src={chat.profilePic || "https://via.placeholder.com/40"}
              alt={chat.name}
              className="w-10 h-10 rounded-full"
            />
            <span>{chat.name}</span>
          </div>
        ))}
      </div>
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b border-base-300">
          <h1 className="text-2xl font-bold text-base-content">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {selectedChat ? (
            <ChatContainer selectedChat={selectedChat} />
          ) : (
            <div className="p-4 text-base-content/60">
              Select a chat to start messaging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
