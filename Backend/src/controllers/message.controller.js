import User from "../models/user.model.js";
import Message from "../models/message.model.js"; // Ensure path is correct
import { redis } from "../lib/redis.js"; // Ensure path is correct
import { io } from "../lib/socket.js"; // Ensure path is correct
import mongoose from "mongoose"; // Needed for ObjectId

export const storeMessage = async (messageData) => {
  try {
    const newMessage = new Message(messageData);
    await newMessage.save();

    // Cache individual message
    const messageKey = `message:${newMessage.senderId}:${newMessage.receiverId}:${newMessage._id}`;
    await redis.set(
      messageKey,
      JSON.stringify(newMessage),
      "EX",
      60 * 60 * 24 * 7
    );

    // Update chat-level caches for both users
    const senderCacheKey = `messages:${newMessage.senderId}:${newMessage.receiverId}`;
    const receiverCacheKey = `messages:${newMessage.receiverId}:${newMessage.senderId}`;

    // Sender's cache
    await redis.rPush(senderCacheKey, JSON.stringify(newMessage));
    await redis.expire(senderCacheKey, 60 * 60 * 24 * 7);

    // Receiver's cache
    await redis.rPush(receiverCacheKey, JSON.stringify(newMessage));
    await redis.expire(receiverCacheKey, 60 * 60 * 24 * 7);

    console.log(`Message ${newMessage._id} stored and cached for both users.`);
    return newMessage;
  } catch (error) {
    console.error("Error storing message:", error);
    throw error;
  }
};

// Update chat list cache in Redis for both users
export const updateChatListCache = async (message) => {
  const { senderId, receiverId } = message;
  const usersToUpdate = [senderId.toString(), receiverId.toString()];

  for (const userId of usersToUpdate) {
    const cacheKey = `chatList:${userId}`;
    try {
      let chatList = [];
      const cachedList = await redis.get(cacheKey);
      if (cachedList) {
        chatList = JSON.parse(cachedList);
      }

      // Find if chat already exists
      const partnerId =
        userId === senderId.toString()
          ? receiverId.toString()
          : senderId.toString();
      let chatIndex = chatList.findIndex((chat) => chat.id === partnerId);

      const partner = await User.findById(partnerId).select("name profilePic"); // Adjust fields as needed
      if (!partner) continue; // Skip if partner not found

      const chatEntry = {
        id: partnerId,
        name: partner.name, // Or derive from email like your original code
        profilePic: partner.profilePic,
        lastMessage: message.content,
        lastMessageTimestamp: message.createdAt,
        lastMessageType: message.contentType,
        unreadCount:
          userId === receiverId.toString() && !message.isRead ? 1 : 0, // Initial unread count if receiver
        isTyping: false, // Default value
        online: io.sockets.adapter.rooms.has(partnerId), // Basic online check (needs improvement for scale)
      };

      if (chatIndex !== -1) {
        // Update existing chat
        chatList[chatIndex].lastMessage = message.content;
        chatList[chatIndex].lastMessageTimestamp = message.createdAt;
        chatList[chatIndex].lastMessageType = message.contentType;
        // Increment unread count only if the current user is the receiver and message is new
        if (userId === receiverId.toString()) {
          chatList[chatIndex].unreadCount =
            (chatList[chatIndex].unreadCount || 0) + 1;
        }
        // Move updated chat to the top
        const updatedChat = chatList.splice(chatIndex, 1)[0];
        chatList.unshift(updatedChat);
      } else {
        // Add new chat to the top
        chatList.unshift(chatEntry);
      }

      // Cache the updated list (e.g., TTL 1 day)
      await redis.set(cacheKey, JSON.stringify(chatList), "EX", 60 * 60 * 24); // 1 day TTL
      console.log(`Chat list cache updated for user ${userId}`);
    } catch (error) {
      console.error(
        `Error updating chat list cache for user ${userId}:`,
        error
      );
    }
  }
};

// Get dynamic chat list (More Robust Version with DB Fallback)
export const getChatList = async (req, res) => {
  const userId = req.user?._id; // Assuming protectRoute adds user to req
  const cacheKey = `chatList:${userId}`;

  try {
    // 1. Try fetching from Redis cache
    // const cachedList = await redis.get(cacheKey);
    // if (cachedList) {
    //   console.log(`Chat list cache hit for user ${userId}`);
    //   return res.status(200).json(JSON.parse(cachedList));
    // }

    console.log(`Chat list cache miss for user ${userId}, fetching from DB.`);

    // 2. Fetch from MongoDB if cache misses
    const user = await User.findById(userId).populate(
      "followers",
      "fullName profilePic _id"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Aggregate recent conversations from Messages
    const recentMessages = await Message.aggregate([
      { $match: { $or: [{ senderId: user._id }, { receiverId: user._id }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$senderId", user._id] },
              then: "$receiverId",
              else: "$senderId",
            },
          },
          lastMessage: { $first: "$content" },
          lastMessageTimestamp: { $first: "$createdAt" },
          lastMessageType: { $first: "$contentType" },
          senderId: { $first: "$senderId" },
          receiverId: { $first: "$receiverId" },
          isReadLookup: { $first: "$isRead" },
        },
      },
      { $sort: { lastMessageTimestamp: -1 } },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "partnerInfo",
        },
      },
      { $unwind: "$partnerInfo" },
      {
        $lookup: {
          from: "messages",
          let: { partner_id: "$_id", user_id: user._id },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$senderId", "$$partner_id"] },
                    { $eq: ["$receiverId", "$$user_id"] },
                    { $eq: ["$isRead", false] },
                  ],
                },
              },
            },
            { $count: "unread" },
          ],
          as: "unreadMessages",
        },
      },
      {
        $project: {
          id: "$_id",
          fullName: "$partnerInfo.fullName",
          profilePic: "$partnerInfo.profilePic",
          lastMessage: 1,
          lastMessageTimestamp: 1,
          lastMessageType: 1,
          unreadCount: { $ifNull: [{ $first: "$unreadMessages.unread" }, 0] },
          isTyping: { $literal: false }, // Static value, no exclusion
          online: { $literal: false }, // Placeholder, will fix below
        },
      },
    ]);

    // Combine followers who haven't messaged recently
    const chatListPartners = new Set(
      recentMessages.map((chat) => chat.id.toString())
    );
    const followerChats = user.followers
      .filter((f) => !chatListPartners.has(f._id.toString()))
      .map((f) => ({
        id: f._id.toString(),
        fullName: f.fullName,
        profilePic: f.profilePic,
        lastMessage: null,
        lastMessageTimestamp: null,
        lastMessageType: null,
        unreadCount: 0,
        isTyping: false,
        online: false, // Placeholder
      }));

    const finalChatList = [...recentMessages, ...followerChats];

    // Cache the result
    // await redis.set(
    //   cacheKey,
    //   JSON.stringify(finalChatList),
    //   "EX",
    //   60 * 60 * 24
    // );

    console.log("Chat list fetched from DB:", finalChatList);
    res.status(200).json(finalChatList);
  } catch (error) {
    console.error("Error fetching chat list:", error);
    res.status(500).json({ message: "Server error fetching chat list" });
  }
};

// Inject io for online status (if using Socket.IO)
let ioInstance; // Global reference
export const setIoInstance = (io) => {
  ioInstance = io;
};

// Fetch initial messages (More Robust Version with DB Fallback)
export const fetchInitialMessages = async (req, res) => {
  const userId = req.user?._id;
  const { chatId: partnerId } = req.params;
  const cacheKey = `messages:${userId}:${partnerId}`;

  try {
    const cachedMessagesJson = await redis.lRange(cacheKey, 0, -1); // -1 for all messages

    if (cachedMessagesJson && cachedMessagesJson.length > 0) {
      console.log(`Messages cache hit for chat ${userId}-${partnerId}`);
      const cachedMessages = cachedMessagesJson.map((msg) => JSON.parse(msg));
      return res.status(200).json(cachedMessages);
    }

    console.log(
      `Messages cache miss for chat ${userId}-${partnerId}, fetching from DB.`
    );
    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    })
      .sort({ createdAt: 1 }) // Oldest first
      .lean();

    if (messages.length > 0) {
      const multi = redis.multi();
      multi.del(cacheKey);
      messages.forEach((msg) => {
        multi.rPush(cacheKey, JSON.stringify(msg));
      });
      multi.expire(cacheKey, 60 * 60 * 24 * 7);
      await multi.exec();
      console.log(`Cached all messages for chat ${userId}-${partnerId}`);
    }

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error fetching messages" });
  }
};

// Send a new message (Enhanced with offline handling logic, relies on socket more)
// Note: The first file primarily handled sending via socket event, API was secondary.
// This version keeps the API endpoint but adds offline check logic similar to the socket handler.
export const sendMessage = async (req, res) => {
  const senderId = req.user?._id;
  const { receiverId, content, contentType = "text" } = req.body;

  if (!receiverId || !content) {
    return res
      .status(400)
      .json({ message: "Receiver ID and content are required" });
  }

  try {
    const messageData = {
      _id: new mongoose.Types.ObjectId(), // Pre-generate ID for consistency
      senderId,
      receiverId,
      content,
      contentType,
      timestamp: new Date(),
      deliveryStatus: "sent", // Initial status
      isRead: false,
      isDeleted: false,
    };

    // Store in DB and Cache
    const newMessage = await storeMessage(messageData);

    // Update Chat List Cache
    await updateChatListCache(newMessage);

    // Emit via Socket.IO
    const receiverSocketId = io.sockets.adapter.rooms.has(receiverId); // Check if receiver is connected TO THIS INSTANCE

    if (receiverSocketId) {
      // Receiver is online, emit message directly
      io.to(receiverId).emit("new_message", newMessage);
      console.log(
        `Message ${newMessage._id} emitted directly to receiver ${receiverId}`
      );
      // Optionally: Update deliveryStatus to 'delivered' immediately if socket emits successfully
      // (Though confirmation from client might be better via 'message_delivered' event)
    } else {
      // Receiver is offline, store message ID in Redis for later delivery
      const undeliveredKey = `undelivered:${receiverId}`;
      await redis.lpush(undeliveredKey, newMessage._id.toString()); // Store message ID
      await redis.expire(undeliveredKey, 60 * 60 * 24 * 14); // Keep undelivered for 14 days
      console.log(
        `Receiver ${receiverId} offline. Message ${newMessage._id} stored as undelivered.`
      );
    }

    // Send response back to sender
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Server error sending message" });
  }
};

export const getChatSuggestions = async (req, res) => {
  const userId = req.user?._id; // Safe access with optional chaining
  console.log("Fetching suggestions for userId:", userId); // Debug log

  try {
    if (!userId) {
      console.log("No userId found in req.user");
      return res
        .status(401)
        .json({ message: "Authentication failed: No user ID" });
    }

    // Check if user exists
    const user = await User.findById(userId).select("following");
    if (!user) {
      console.log("User not found in DB for userId:", userId);
      return res.status(404).json({ message: "User not found" });
    }
    console.log("User found:", user._id, user.email); // Confirm user details

    // Get IDs of users already in chat list (from cache or DB)
    const chatListCache = await redis.get(`chatList:${userId}`);
    let existingChatPartners = [];
    if (chatListCache) {
      existingChatPartners = JSON.parse(chatListCache).map((c) => c.id);
      console.log("Existing chat partners from cache:", existingChatPartners);
    } else {
      console.log("No chat list cache found for userId:", userId);
    }

    const excludedIds = [
      userId,
      ...(user.following || []),
      ...existingChatPartners,
    ].map((id) => id.toString()); // Ensure all IDs are strings
    console.log("Excluded IDs:", excludedIds);

    // Fetch suggestions
    const suggestions = await User.find({
      _id: { $nin: excludedIds }, // Exclude self, following, and chat partners
    })
      .limit(10)
      .select("fullName profilePic _id")
      .lean(); // Use lean for performance
    console.log("Suggestions fetched:", suggestions.length);

    res.status(200).json(suggestions);
  } catch (error) {
    console.error(
      "Error getting chat suggestions:",
      error.message,
      error.stack
    );
    res.status(500).json({ message: "Server error fetching suggestions" });
  }
};

// Get undelivered messages when user comes online (Called by socket connection usually)
export const getUndeliveredMessages = async (req, res) => {
  const userId = req.user?._id;
  const undeliveredKey = `undelivered:${userId}`;

  try {
    const messageIds = await redis.lRange(undeliveredKey, 0, -1); // Get all message IDs

    if (messageIds && messageIds.length > 0) {
      // Fetch messages from MongoDB
      const messages = await Message.find({
        _id: { $in: messageIds },
        isDeleted: false,
      }).lean();

      // Mark messages as delivered in DB and update Redis cache
      const updatePromises = messages.map(async (msg) => {
        // Update DB
        await Message.updateOne(
          { _id: msg._id },
          { $set: { deliveryStatus: "delivered" } }
        );
        // Update Redis Cache for the message
        msg.deliveryStatus = "delivered"; // Update object before caching
        const messageKey = `message:${msg.senderId}:${msg.receiverId}:${msg._id}`;
        await redis.set(
          messageKey,
          JSON.stringify(msg),
          "EX",
          60 * 60 * 24 * 7
        );
        // Emit 'delivered' status update back to sender
        io.to(msg.senderId.toString()).emit("message_delivered", {
          messageId: msg._id,
          chatId: userId,
        });
      });

      await Promise.all(updatePromises);

      // Clear the undelivered list from Redis
      await redis.del(undeliveredKey);

      console.log(
        `Delivered ${messages.length} undelivered messages to user ${userId}`
      );
      res.status(200).json(messages); // Send messages to the client
    } else {
      console.log(`No undelivered messages for user ${userId}`);
      res.status(200).json([]); // No messages
    }
  } catch (error) {
    console.error("Error fetching undelivered messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Mark message as read
export const markMessageAsRead = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?._id; // User marking the message as read (must be the receiver)

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Ensure the user marking as read is the receiver
    if (message.receiverId.toString() !== userId) {
      return res.status(403).json({
        message: "Unauthorized: You are not the receiver of this message",
      });
    }

    // Update only if not already read
    if (!message.isRead) {
      message.isRead = true;
      message.deliveryStatus = "read"; // Update status
      await message.save();

      // Update Redis cache
      const messageKey = `message:${message.senderId}:${message.receiverId}:${message._id}`;
      await redis.set(
        messageKey,
        JSON.stringify(message),
        "EX",
        60 * 60 * 24 * 7
      ); // Update cache with TTL

      // Update chat list cache (to reset unread count) - requires fetching/updating the list
      // TODO: Implement a function to decrement unread count in chat list cache or refetch

      // Emit event to sender so their UI updates to 'read'
      io.to(message.senderId.toString()).emit("message_read", {
        messageId: message._id,
        chatId: userId,
      }); // Send own ID as chatId for sender context

      console.log(`Message ${messageId} marked as read by user ${userId}`);
    }

    res.status(200).json({ message: "Message marked as read", messageId });
  } catch (error) {
    console.error("Error marking message as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a message (Soft Delete)
export const deleteMessage = async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user?._id;

  try {
    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (
      message.senderId.toString() !== userId &&
      message.receiverId.toString() !== userId
    ) {
      return res
        .status(403)
        .json({ message: "Unauthorized to delete this message" });
    }

    if (!message.isDeleted) {
      message.isDeleted = true;
      message.content = "This message was deleted";
      message.contentType = "deleted";
      await message.save();

      // Update individual message cache
      const messageKey = `message:${message.senderId}:${message.receiverId}:${message._id}`;
      await redis.set(
        messageKey,
        JSON.stringify(message),
        "EX",
        60 * 60 * 24 * 7
      );

      // Update chat-level caches for both users
      const senderCacheKey = `messages:${message.senderId}:${message.receiverId}`;
      const receiverCacheKey = `messages:${message.receiverId}:${message.senderId}`;

      // Fetch and update sender's cache
      let senderMessages = await redis.lRange(senderCacheKey, 0, -1);
      if (senderMessages.length > 0) {
        senderMessages = senderMessages.map((msg) => JSON.parse(msg));
        const updatedSenderMessages = senderMessages.map((msg) =>
          msg._id === messageId ? message.toObject() : msg
        );
        const multiSender = redis.multi();
        multiSender.del(senderCacheKey);
        updatedSenderMessages.forEach((msg) =>
          multiSender.rPush(senderCacheKey, JSON.stringify(msg))
        );
        multiSender.expire(senderCacheKey, 60 * 60 * 24 * 7);
        await multiSender.exec();
      }

      // Fetch and update receiver's cache
      let receiverMessages = await redis.lRange(receiverCacheKey, 0, -1);
      if (receiverMessages.length > 0) {
        receiverMessages = receiverMessages.map((msg) => JSON.parse(msg));
        const updatedReceiverMessages = receiverMessages.map((msg) =>
          msg._id === messageId ? message.toObject() : msg
        );
        const multiReceiver = redis.multi();
        multiReceiver.del(receiverCacheKey);
        updatedReceiverMessages.forEach((msg) =>
          multiReceiver.rPush(receiverCacheKey, JSON.stringify(msg))
        );
        multiReceiver.expire(receiverCacheKey, 60 * 60 * 24 * 7);
        await multiReceiver.exec();
      }

      // Emit event to both users
      io.to(message.senderId.toString()).emit("message_deleted", {
        messageId: message._id,
        chatId: message.receiverId.toString(),
      });
      io.to(message.receiverId.toString()).emit("message_deleted", {
        messageId: message._id,
        chatId: message.senderId.toString(),
      });

      console.log(`Message ${messageId} marked as deleted by user ${userId}`);
    }

    res
      .status(200)
      .json({ message: "Message deleted successfully", messageId });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getOnlineUsers = async (req, res) => {
  try {
    const onlineUserIds = await redis.sMembers("onlineUsers");
    // Optionally fetch user details
    const users = await User.find(
      { _id: { $in: onlineUserIds } },
      "username fullName profilePic"
    ).lean();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching online users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
