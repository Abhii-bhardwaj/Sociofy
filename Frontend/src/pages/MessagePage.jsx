import React, { useState, useEffect, useRef, useCallback } from "react";
import useChat from "../hooks/useChat.hook";
import {
  Send,
  Trash2,
  Dot,
  Check,
  CheckCheck,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";

const formatTimestamp = (isoString) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const MessagesPage = () => {
  const {
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
  } = useChat();

  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const activeChat = activeChatId
    ? chatList.find((chat) => chat.id === activeChatId) ||
      suggestions.find((suggestion) => suggestion._id === activeChatId) ||
      null
    : null;

  const currentMessages = activeChatId ? messages[activeChatId] || [] : [];
  const isTyping = activeChatId ? typingUsers[activeChatId] || false : false;

  useEffect(() => {
    console.log("activeChatId changed:", activeChatId);
    if (activeChatId) {
      fetchMessages(activeChatId); // Ensure messages are fetched on activeChatId change
    }
  }, [activeChatId, fetchMessages]);

  useEffect(() => {
    if (activeChatId && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChatId, currentMessages]);

  useEffect(() => {
    console.log("Initial load - Triggering loadSuggestions");
    loadSuggestions();
  }, [loadSuggestions]);

  const handleInputChange = useCallback(
    (e) => {
      setNewMessage(e.target.value);
      if (!connected || !activeChatId) return;

      if (!typingTimeoutRef.current) {
        sendTyping(activeChatId, true);
      } else {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        sendTyping(activeChatId, false);
        typingTimeoutRef.current = null;
      }, 2000);
    },
    [connected, activeChatId, sendTyping]
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        if (activeChatId) {
          sendTyping(activeChatId, false);
        }
      }
    };
  }, [activeChatId, sendTyping]);

  const handleSendMessage = useCallback(
    (e) => {
      e.preventDefault();
      if (!newMessage.trim() || !activeChatId || !connected) return;
      sendMessage(activeChatId, newMessage);
      setNewMessage("");
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
        sendTyping(activeChatId, false);
      }
    },
    [newMessage, activeChatId, connected, sendMessage, sendTyping]
  );

  const handleDeleteMessage = useCallback(
    (messageId) => {
      if (!activeChatId) return;
      deleteMessage(messageId, activeChatId);
    },
    [activeChatId, deleteMessage]
  );

  const handleBackToChats = () => {
    console.log("Back button clicked, clearing activeChatId");
    setActiveChatId(null);
  };

  const handleChatSelect = (chatId) => {
    console.log("Selecting chat:", chatId);
    setActiveChatId(chatId);
    // fetchMessages(chatId); // Removed from here, handled in useEffect
  };

  const renderDeliveryStatus = (message) => {
    if (message.senderId !== currentUserId || !message.deliveryStatus)
      return null;

    const iconSize = 14;
    const className = "opacity-80";

    switch (message.deliveryStatus) {
      case "sending":
        return (
          <Check size={iconSize} className={`text-base-content ${className}`} />
        );
      case "sent":
        return (
          <Check size={iconSize} className={`text-base-content ${className}`} />
        );
      case "delivered":
        return (
          <CheckCheck
            size={iconSize}
            className={`text-base-content ${className}`}
          />
        );
      case "read":
        return (
          <CheckCheck size={iconSize} className={`text-info ${className}`} />
        );
      case "failed":
        return (
          <span className="text-error text-xs font-semibold ml-1">Failed</span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-base-200 text-base-content overflow-hidden">
      <div
        className={`w-full md:w-1/3 lg:w-1/4 min-w-[200px] max-w-[350px] bg-base-100 md:border-r md:border-base-300 flex flex-col ${
          activeChatId ? "hidden md:flex" : "flex"
        }`}>
        <div className="p-3 sm:p-4 border-b border-base-300 sticky top-0 bg-base-100 z-10">
          <h2 className="text-lg sm:text-xl font-semibold">Chats</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingInitial ? (
            <div className="p-4 text-base-content opacity-70 flex items-center justify-center h-full">
              Loading chats...{" "}
              <span className="loading loading-spinner loading-sm ml-2"></span>
            </div>
          ) : (
            <>
              {chatList.length > 0 ? (
                <div className="border-b border-base-200 pb-2">
                  {chatList.map((chat) => (
                    <div
                      key={chat.id}
                      className={`flex items-center p-2 sm:p-3 cursor-pointer border-b border-base-200 hover:bg-base-200 transition-colors duration-150 ${
                        activeChatId === chat.id
                          ? "bg-base-300 font-semibold"
                          : ""
                      }`}
                      onClick={() => handleChatSelect(chat.id)}>
                      <div className="avatar mr-2 sm:mr-3 flex-shrink-0">
                        <div className="w-8 sm:w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                          <img
                            src={
                              chat.profilePic ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                chat.fullName || "?"
                              )}&background=random`
                            }
                            alt={chat.fullName || "Chat user"}
                            onError={(e) =>
                              (e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                chat.fullName || "?"
                              )}&background=random`)
                            }
                          />
                        </div>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <h3
                            className={`truncate text-sm sm:text-base ${
                              activeChatId === chat.id ? "" : "font-medium"
                            }`}>
                            {chat.fullName || "Unknown User"}
                          </h3>
                          {chat.lastMessageTimestamp && (
                            <span className="text-xs text-base-content opacity-60 ml-2 flex-shrink-0">
                              {formatTimestamp(chat.lastMessageTimestamp)}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs sm:text-sm mt-1">
                          {chat.isTyping ? (
                            <p className="text-info italic truncate">
                              typing...
                            </p>
                          ) : (
                            <p className="truncate text-base-content opacity-70">
                              {chat.lastMessage || "No messages yet"}
                            </p>
                          )}
                          {chat.unreadCount > 0 && (
                            <span className="badge badge-primary badge-xs sm:badge-sm ml-2">
                              {chat.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-base-content opacity-70 text-center text-sm">
                  No active chats yet.
                </div>
              )}

              <div className="p-2 sm:p-4">
                <h3 className="text-xs sm:text-sm font-semibold text-base-content opacity-80 mb-2">
                  Suggestions
                </h3>
                {loadingSuggestions ? (
                  <div className="text-base-content opacity-70 flex items-center justify-center text-sm">
                    Loading suggestions...{" "}
                    <span className="loading loading-spinner loading-sm ml-2"></span>
                  </div>
                ) : suggestions.length > 0 ? (
                  suggestions.map((suggestion) => (
                    <div
                      key={suggestion._id}
                      className={`flex items-center p-2 hover:bg-base-200 cursor-pointer rounded-lg mb-1 transition-colors duration-150 ${
                        activeChatId === suggestion._id
                          ? "bg-base-300 font-semibold"
                          : ""
                      }`}
                      onClick={() => handleChatSelect(suggestion._id)}>
                      <div className="avatar mr-2 flex-shrink-0">
                        <div className="w-6 sm:w-8 rounded-full">
                          <img
                            src={
                              suggestion.profilePic ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                suggestion.fullName || "?"
                              )}&background=random`
                            }
                            alt={suggestion.fullName || "Suggested user"}
                            onError={(e) =>
                              (e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                suggestion.fullName || "?"
                              )}&background=random`)
                            }
                          />
                        </div>
                      </div>
                      <span className="text-xs sm:text-sm truncate">
                        {suggestion.fullName || "Unknown User"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-base-content opacity-70 text-center text-sm">
                    No suggestions available.
                    <button
                      className="btn btn-primary btn-xs mt-2"
                      onClick={loadSuggestions}>
                      Refresh
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className={`w-full md:flex-1 flex flex-col bg-base-200 ${
          activeChatId && activeChat ? "flex" : "hidden md:flex"
        }`}>
        {activeChatId && activeChat ? (
          <>
            <div className="p-2 sm:p-3 border-b border-base-300 bg-base-100 flex items-center shadow-sm sticky top-0 z-10">
              <button
                className="md:hidden btn btn-ghost btn-sm mr-2"
                onClick={handleBackToChats}
                aria-label="Back to chats">
                <ArrowLeft size={20} />
              </button>
              <div className="avatar mr-2 sm:mr-3 flex-shrink-0">
                <div className="w-8 sm:w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-1">
                  <img
                    src={
                      activeChat.profilePic ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        activeChat.fullName || "?"
                      )}&background=random`
                    }
                    alt={activeChat.fullName || "Chat partner"}
                    onError={(e) =>
                      (e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        activeChat.fullName || "?"
                      )}&background=random`)
                    }
                  />
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <h2 className="text-base sm:text-lg font-semibold truncate">
                  {activeChat.fullName || "Unknown User"}
                </h2>
                <p className="text-xs">
                  {activeChat.online ? (
                    <span className="text-success flex items-center">
                      <Dot size={14} /> Online
                    </span>
                  ) : (
                    <span className="text-base-content opacity-60">
                      Offline
                    </span>
                  )}
                  {isTyping && (
                    <span className="text-info italic"> - typing...</span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-base-200">
              {loadingMessages ? (
                <div className="text-center text-base-content opacity-70 pt-10 text-sm">
                  Loading messages...{" "}
                  <span className="loading loading-spinner loading-sm"></span>
                </div>
              ) : currentMessages.length > 0 ? (
                currentMessages.map((msg) => (
                  <div
                    key={msg._id}
                    className={`chat ${
                      msg.senderId === currentUserId ? "chat-end" : "chat-start"
                    }`}>
                    <div
                      className={`chat-bubble relative group text-sm sm:text-base ${
                        msg.senderId === currentUserId
                          ? "chat-bubble-primary"
                          : ""
                      } ${
                        msg.isDeleted
                          ? "italic opacity-60 !bg-base-300 !text-base-content"
                          : ""
                      } ${
                        msg.deliveryStatus === "failed"
                          ? "chat-bubble-error"
                          : ""
                      } ${
                        msg.deliveryStatus === "sending" ? "opacity-75" : ""
                      }`}>
                      <p className="break-words">
                        {msg.isDeleting ? (
                          <span className="italic text-gray-500">
                            Deleting...
                          </span>
                        ) : msg.isDeleted ? (
                          <span className="italic text-gray-500">
                            This message was deleted
                          </span>
                        ) : (
                          msg.content
                        )}
                      </p>
                      <div className="chat-footer flex items-center justify-end mt-1 space-x-1 text-xs opacity-70">
                        {renderDeliveryStatus(msg)}
                        <span>{formatTimestamp(msg.createdAt)}</span>
                      </div>
                      {!msg.isDeleted &&
                        msg.senderId === currentUserId &&
                        msg.deliveryStatus !== "sending" && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="absolute top-1 -left-2 p-1 text-base-content opacity-0 group-hover:opacity-50 hover:!opacity-100 hover:text-error transition-opacity duration-150"
                            title="Delete message">
                            <Trash2 size={12} />
                          </button>
                        )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-base-content opacity-70 pt-10 text-sm">
                  No messages yet. Start chatting!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-2 sm:p-3 md:p-4 border-t border-base-300 bg-base-100 sticky bottom-0">
              <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  className="input input-bordered rounded-full flex-1 text-sm sm:text-base focus:ring-primary focus:border-primary"
                  placeholder="Type a message..."
                  disabled={!connected}
                  aria-label="Type a message"
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-circle btn-sm sm:btn-md flex-shrink-0"
                  disabled={!newMessage.trim() || !connected}
                  aria-label="Send message">
                  <Send size={18} />
                </button>
              </form>
              {!connected && (
                <p className="text-xs text-error mt-1 text-center opacity-80">
                  You are currently offline. Messages cannot be sent.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="hidden md:flex md:flex-1 flex-col items-center justify-center bg-base-200 text-center p-5">
            <div className="text-center text-base-content opacity-70">
              <MessageSquare
                size={48}
                className="mx-auto mb-4 opacity-50 sm:size-56"
              />
              <p className="mb-4 font-semibold text-sm sm:text-base">
                Select a chat
              </p>
              <p className="text-xs sm:text-sm mb-4">
                Choose an existing conversation or find someone new to talk to.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;
