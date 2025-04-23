// src/server/socket.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import { redis } from "../lib/redis.js";
import mongoose from "mongoose";
import {
  storeMessage,
  updateChatListCache,
} from "../controllers/message.controller.js";

let io;

export function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.VITE_APP_URL || "https://sociofy-ynkj.onrender.com",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    // Handle token from auth or cookie
    if (token && token.startsWith("Bearer ")) {
      token = token.slice(7);
    } else if (!token && socket.handshake.headers.cookie) {
      token = socket.handshake.headers.cookie
        .split("; ")
        .find((row) => row.startsWith("jwt="))
        ?.split("=")[1];
    }
    console.log("Token received for HandShaking : ", token);
    if (!token) {
      console.error("Socket Auth Error: No token provided.");
      return next(new Error("Authentication error: No token"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACTIVE_KEY);
      socket.user = { userId: decoded.userId };
      console.log("Socket Auth: Token verified, userId:", decoded.userId);
      next();
    } catch (err) {
      console.error(
        "Socket Auth Error: Token verification failed:",
        err.message,
        token
      );
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.userId;
    if (!userId) {
      console.error("Socket Connection Error: User ID not found after auth.");
      socket.disconnect(true);
      return;
    }
    console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

    socket.join(userId);

    // Add user to onlineUsers in Redis and emit user_online
    redis.sadd("onlineUsers", userId).catch((err) => {
      console.error("Redis Error: Failed to add user to onlineUsers:", err);
    });
    io.emit("user_online", { userId }); // Broadcast to all clients
    console.log(`Emitted user_online for ${userId}`);

    // Fetch and emit online status of chat partners
    const emitChatPartnersStatus = async () => {
      try {
        const chatList = await Message.find({
          $or: [{ senderId: userId }, { receiverId: userId }],
        })
          .distinct("senderId receiverId")
          .lean();
        const partnerIds = chatList.filter((id) => id !== userId);
        const onlinePartners = await redis.sMembers("onlineUsers");
        const onlinePartnerIds = partnerIds.filter((id) =>
          onlinePartners.includes(id)
        );
        onlinePartnerIds.forEach((partnerId) => {
          socket.emit("user_online", { userId: partnerId });
        });
        console.log(
          `Emitted user_online for partners of ${userId}:`,
          onlinePartnerIds
        );
      } catch (error) {
        console.error(`Error fetching chat partners for ${userId}:`, error);
      }
    };
    emitChatPartnersStatus();

    const deliverUndelivered = async () => {
      const undeliveredKey = `undelivered:${userId}`;
      try {
        const messageIds = await redis.lRange(undeliveredKey, 0, -1);
        if (messageIds && messageIds.length > 0) {
          console.log(
            `Found ${messageIds.length} undelivered messages for ${userId}`
          );
          const messages = await Message.find({
            _id: { $in: messageIds },
            isDeleted: false,
          }).lean();

          const updatePromises = messages.map(async (msg) => {
            if (msg.deliveryStatus === "sent") {
              await Message.updateOne(
                { _id: msg._id },
                { $set: { deliveryStatus: "delivered" } }
              );
              msg.deliveryStatus = "delivered";
              await updateMessageCache(msg._id, msg.senderId, msg.receiverId, {
                deliveryStatus: "delivered",
              });
              socket.emit("new_message", msg);
              io.to(msg.senderId.toString()).emit("message_delivered", {
                messageId: msg._id,
                chatId: msg.receiverId.toString(),
              });
            } else {
              socket.emit("new_message", msg);
            }
          });

          await Promise.all(updatePromises);
          await redis.del(undeliveredKey);
          console.log(`Processed undelivered messages for user ${userId}`);
        }
      } catch (error) {
        console.error(
          `Error delivering undelivered messages to ${userId}:`,
          error
        );
      }
    };
    deliverUndelivered();

    // Store Notification Helper
    const storeNotification = async ({
      userId,
      type,
      message,
      relatedId,
      relatedModel,
      senderId,
      senderDetails,
      chatId,
      postId,
      commentId,
    }) => {
      try {
        const notification = new Notification({
          userId,
          type,
          message,
          relatedId,
          relatedModel,
          sender: senderId,
          read: false,
        });
        await notification.save();

        // Cache in Redis
        const cacheKey = `notifications:${userId}`;
        const cachedNotifications = await redis.get(cacheKey);
        let notifications = cachedNotifications
          ? JSON.parse(cachedNotifications)
          : [];
        notifications.push({
          ...notification.toObject(),
          content: message,
          sender: senderDetails,
        });
        await redis.set(cacheKey, JSON.stringify(notifications), "EX", 1200);

        console.log(`Stored notification for ${userId}:`, {
          _id: notification._id,
          type,
          read: notification.read,
          sender: senderDetails,
        });

        return { notification, sender: senderDetails };
      } catch (error) {
        console.error(`Error storing notification for ${userId}:`, error);
        return null;
      }
    };

    // Existing Message Events
    socket.on("typing", ({ receiverId }) => {
      if (!receiverId) return;
      socket.to(receiverId).emit("user_typing", { userId });
      console.log(`Typing event from ${userId} to ${receiverId}`);
    });

    socket.on("stop_typing", ({ receiverId }) => {
      if (!receiverId) return;
      socket.to(receiverId).emit("user_stop_typing", { userId });
      console.log(`Stop typing event from ${userId} to ${receiverId}`);
    });

    socket.on("chat_active", ({ chatId }) => {
      console.log(`Chat active for user ${userId} with chatId ${chatId}`);
      socket.join(chatId);
    });

    socket.on(
      "direct_message",
      async ({ receiverId, content, contentType = "text", tempId }, ack) => {
        const senderId = socket.user.userId;
        console.log(
          `Socket Event: direct_message from ${senderId} to ${receiverId}`
        );

        if (!receiverId || !content || !senderId) {
          console.error(
            "Socket Event Error: Missing receiverId, content, or senderId"
          );
          if (typeof ack === "function")
            ack({
              success: false,
              error: "Missing required message data",
              tempId,
            });
          return;
        }

        try {
          const sender = await User.findById(senderId).select(
            "username fullName profilePic"
          );
          if (!sender) throw new Error("Sender not found");
          console.log(`Sender details:`, sender);

          const chatId = [senderId, receiverId].sort().join("-");
          const messageData = {
            _id: new mongoose.Types.ObjectId(),
            senderId,
            receiverId,
            chatId,
            content,
            contentType,
            deliveryStatus: "sent",
            isRead: false,
            isDeleted: false,
            createdAt: new Date(),
          };

          const newMessage = await storeMessage(messageData);
          await updateChatListCache(newMessage);

          const isReceiverOnline = io.sockets.adapter.rooms.has(receiverId);

          if (typeof ack === "function") {
            ack({ success: true, message: newMessage, tempId });
          }

          if (isReceiverOnline) {
            io.to(receiverId).emit("new_message", newMessage);
            console.log(`Message ${newMessage._id} emitted to ${receiverId}`);
            await Message.updateOne(
              { _id: newMessage._id },
              { $set: { deliveryStatus: "delivered" } }
            );
            newMessage.deliveryStatus = "delivered";
            await updateMessageCache(newMessage._id, senderId, receiverId, {
              deliveryStatus: "delivered",
            });
            io.to(senderId).emit("message_delivered", {
              messageId: newMessage._id,
              chatId: receiverId,
            });
          } else {
            const undeliveredKey = `undelivered:${receiverId}`;
            await redis.lPush(undeliveredKey, newMessage._id.toString());
            await redis.expire(undeliveredKey, 60 * 60 * 24 * 14);
            console.log(
              `Receiver ${receiverId} offline. Message ${newMessage._id} stored.`
            );
          }

          // Store and emit notification
          const senderDetails = {
            _id: senderId,
            username: sender.username,
            profilePic: sender.profilePic || "placeholder.jpeg",
            fullName: sender.fullName,
          };
          const { notification, sender: senderData } = await storeNotification({
            userId: receiverId,
            type: "message",
            message: `New message from ${sender.username}`,
            relatedId: newMessage._id,
            relatedModel: "Message",
            senderId,
            senderDetails,
            chatId,
          });
          if (notification) {
            io.to(receiverId).emit("notification", {
              _id: notification._id,
              type: "message",
              sender: senderData,
              content: `New message from ${sender.username}`,
              chatId,
              read: false,
              timestamp: notification.createdAt,
            });
            console.log(
              `Emitted message notification to ${receiverId}:`,
              notification._id
            );
          }
        } catch (error) {
          console.error(`Error in direct_message from ${senderId}:`, error);
          if (typeof ack === "function") {
            ack({
              success: false,
              error: "Server failed to process message",
              tempId,
            });
          }
        }
      }
    );

    socket.on("mark_as_read", async ({ messageId, senderId }) => {
      console.log(
        `Socket Event: mark_as_read for ${messageId} by ${socket.user.userId}`
      );
      if (!messageId || !senderId) return;

      try {
        const message = await Message.findById(messageId);
        if (
          message &&
          message.receiverId.toString() === socket.user.userId &&
          !message.isRead
        ) {
          message.isRead = true;
          message.deliveryStatus = "read";
          await message.save();

          const chatId = [senderId, socket.user.userId].sort().join("-");
          await updateMessageCache(message._id, senderId, socket.user.userId, {
            isRead: true,
            deliveryStatus: "read",
          });

          io.to(senderId).emit("message_read", {
            messageId: message._id,
            chatId: socket.user.userId,
          });
          io.to(socket.user.userId).emit("message_read", {
            messageId: message._id,
            chatId: senderId,
          });
        }
      } catch (error) {
        console.error(`Error in mark_as_read for ${messageId}:`, error);
      }
    });

    // Post Interaction Events
    socket.on("like_post", async ({ postId, userId, likerId }) => {
      console.log(`Socket Event: like_post on ${postId} by ${likerId}`);
      try {
        const liker = await User.findById(likerId).select(
          "username profilePic fullName"
        );
        if (!liker) throw new Error("Liker not found");
        console.log(`Liker details:`, liker);
        if (userId === likerId) return;

        const senderDetails = {
          _id: likerId,
          username: liker.username,
          profilePic: liker.profilePic || "placeholder.jpeg",
          fullName: liker.fullName,
        };
        const { notification, sender } = await storeNotification({
          userId,
          type: "like",
          message: `${liker.username} liked your post`,
          relatedId: postId,
          relatedModel: "Post",
          senderId: likerId,
          senderDetails,
          postId,
        });

        if (notification) {
          io.to(userId).emit("notification", {
            _id: notification._id,
            type: "like",
            sender,
            content: `${liker.username} liked your post`,
            postId,
            read: false,
            timestamp: notification.createdAt,
          });
          console.log(
            `Emitted like notification to ${userId}:`,
            notification._id
          );
        }
      } catch (error) {
        console.error(`Error in like_post for ${postId}:`, error);
      }
    });

    socket.on("unlike_post", async ({ postId, userId, unlikerId }) => {
      console.log(`Socket Event: unlike_post on ${postId} by ${unlikerId}`);
      // No notification for unlike
    });

    socket.on(
      "comment_post",
      async ({ postId, userId, commenterId, content }) => {
        console.log(
          `Socket Event: comment_post on ${postId} by ${commenterId}`
        );
        try {
          const commenter = await User.findById(commenterId).select(
            "username profilePic fullName"
          );
          if (!commenter) throw new Error("Commenter not found");
          console.log(`Commenter details:`, commenter);
          if (userId === commenterId) return;

          const senderDetails = {
            _id: commenterId,
            username: commenter.username,
            profilePic: commenter.profilePic || "placeholder.jpeg",
            fullName: commenter.fullName,
          };
          const { notification, sender } = await storeNotification({
            userId,
            type: "comment",
            message: `${commenter.username} commented: "${content.slice(
              0,
              50
            )}${content.length > 50 ? "..." : ""}"`,
            relatedId: postId,
            relatedModel: "Post",
            senderId: commenterId,
            senderDetails,
            postId,
          });

          if (notification) {
            io.to(userId).emit("notification", {
              _id: notification._id,
              type: "comment",
              sender,
              content: `${commenter.username} commented: "${content.slice(
                0,
                50
              )}${content.length > 50 ? "..." : ""}"`,
              postId,
              read: false,
              timestamp: notification.createdAt,
            });
            console.log(
              `Emitted comment notification to ${userId}:`,
              notification._id
            );
          }
        } catch (error) {
          console.error(`Error in comment_post for ${postId}:`, error);
        }
      }
    );

    socket.on("share_post", async ({ postId, userId, sharerId }) => {
      console.log(`Socket Event: share_post on ${postId} by ${sharerId}`);
      try {
        const sharer = await User.findById(sharerId).select(
          "username profilePic fullName"
        );
        if (!sharer) throw new Error("Sharer not found");
        console.log(`Sharer details:`, sharer);
        if (userId === sharerId) return;

        const senderDetails = {
          _id: sharerId,
          username: sharer.username,
          profilePic: sharer.profilePic || "placeholder.jpeg",
          fullName: sharer.fullName,
        };
        const { notification, sender } = await storeNotification({
          userId,
          type: "post_share",
          message: `${sharer.username} shared your post`,
          relatedId: postId,
          relatedModel: "Post",
          senderId: sharerId,
          senderDetails,
          postId,
        });

        if (notification) {
          io.to(userId).emit("notification", {
            _id: notification._id,
            type: "post_share",
            sender,
            content: `${sharer.username} shared your post`,
            postId,
            read: false,
            timestamp: notification.createdAt,
          });
          console.log(
            `Emitted share notification to ${userId}:`,
            notification._id
          );
        }
      } catch (error) {
        console.error(`Error in share_post for ${postId}:`, error);
      }
    });

    socket.on(
      "like_comment",
      async ({ postId, commentId, userId, likerId }) => {
        console.log(`Socket Event: like_comment on ${commentId} by ${likerId}`);
        try {
          const liker = await User.findById(likerId).select(
            "username profilePic fullName"
          );
          const comment = await Comment.findById(commentId).select("userId");
          if (!liker || !comment) throw new Error("Liker or comment not found");
          console.log(`Liker details:`, liker);

          const commentOwnerId = comment.userId.toString();
          if (bootstrappedId !== likerId) {
            const senderDetails = {
              _id: likerId,
              username: liker.username,
              profilePic: liker.profilePic || "placeholder.jpeg",
              fullName: liker.fullName,
            };
            const { notification, sender } = await storeNotification({
              userId: commentOwnerId,
              type: "comment_like",
              message: `${liker.username} liked your comment`,
              relatedId: commentId,
              relatedModel: "Comment",
              senderId: likerId,
              senderDetails,
              postId,
              commentId,
            });

            if (notification) {
              io.to(commentOwnerId).emit("notification", {
                _id: notification._id,
                type: "comment_like",
                sender,
                content: `${liker.username} liked your comment`,
                postId,
                commentId,
                read: false,
                timestamp: notification.createdAt,
              });
              console.log(
                `Emitted comment_like notification to ${commentOwnerId}:`,
                notification._id
              );
            }
          }

          if (userId !== commentOwnerId && userId !== likerId) {
            const postOwner = await User.findById(userId).select(
              "username profilePic fullName"
            );
            if (postOwner) {
              console.log(`PostOwner details:`, postOwner);
              const senderDetails = {
                _id: likerId,
                username: liker.username,
                profilePic: liker.profilePic || "placeholder.jpeg",
                fullName: liker.fullName,
              };
              const { notification, sender } = await storeNotification({
                userId,
                type: "comment_like",
                message: `${liker.username} liked a comment on your post`,
                relatedId: commentId,
                relatedModel: "Comment",
                senderId: likerId,
                senderDetails,
                postId,
                commentId,
              });

              if (notification) {
                io.to(userId).emit("notification", {
                  _id: notification._id,
                  type: "comment_like",
                  sender,
                  content: `${liker.username} liked a comment on your post`,
                  postId,
                  commentId,
                  read: false,
                  timestamp: notification.createdAt,
                });
                console.log(
                  `Emitted comment_like notification to ${userId}:`,
                  notification._id
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error in like_comment for ${commentId}:`, error);
        }
      }
    );

    socket.on(
      "reply_comment",
      async ({ postId, commentId, userId, replierId, content }) => {
        console.log(
          `Socket Event: reply_comment on ${commentId} by ${replierId}`
        );
        try {
          const replier = await User.findById(replierId).select(
            "username profilePic fullName"
          );
          const comment = await Comment.findById(commentId).select("userId");
          if (!replier || !comment)
            throw new Error("Replier or comment not found");
          console.log(`Replier details:`, replier);

          const commentOwnerId = comment.userId.toString();
          if (commentOwnerId !== replierId) {
            const senderDetails = {
              _id: replierId,
              username: replier.username,
              profilePic: replier.profilePic || "placeholder.jpeg",
              fullName: replier.fullName,
            };
            const { notification, sender } = await storeNotification({
              userId: commentOwnerId,
              type: "comment_reply",
              message: `${
                replier.username
              } replied to your comment: "${content.slice(0, 50)}${
                content.length > 50 ? "..." : ""
              }"`,
              relatedId: commentId,
              relatedModel: "Comment",
              senderId: replierId,
              senderDetails,
              postId,
              commentId,
            });

            if (notification) {
              io.to(commentOwnerId).emit("notification", {
                _id: notification._id,
                type: "comment_reply",
                sender,
                content: `${
                  replier.username
                } replied to your comment: "${content.slice(0, 50)}${
                  content.length > 50 ? "..." : ""
                }"`,
                postId,
                commentId,
                read: false,
                timestamp: notification.createdAt,
              });
              console.log(
                `Emitted comment_reply notification to ${commentOwnerId}:`,
                notification._id
              );
            }
          }

          if (userId !== commentOwnerId && userId !== replierId) {
            const postOwner = await User.findById(userId).select(
              "username profilePic fullName"
            );
            if (postOwner) {
              console.log(`PostOwner details:`, postOwner);
              const senderDetails = {
                _id: replierId,
                username: replier.username,
                profilePic: replier.profilePic || "placeholder.jpeg",
                fullName: replier.fullName,
              };
              const { notification, sender } = await storeNotification({
                userId,
                type: "comment_reply",
                message: `${replier.username} replied to a comment on your post`,
                relatedId: commentId,
                relatedModel: "Comment",
                senderId: replierId,
                senderDetails,
                postId,
                commentId,
              });

              if (notification) {
                io.to(userId).emit("notification", {
                  _id: notification._id,
                  type: "comment_reply",
                  sender,
                  content: `${replier.username} replied to a comment on your post`,
                  postId,
                  commentId,
                  read: false,
                  timestamp: notification.createdAt,
                });
                console.log(
                  `Emitted comment_reply notification to ${userId}:`,
                  notification._id
                );
              }
            }
          }
        } catch (error) {
          console.error(`Error in reply_comment for ${commentId}:`, error);
        }
      }
    );

    // Follow Events
    socket.on("followUpdate", async ({ followerId, followingId }) => {
      console.log(
        `Socket Event: followUpdate ${followerId} follows ${followingId}`
      );
      try {
        const follower = await User.findById(followerId).select(
          "username profilePic fullName"
        );
        if (!follower) throw new Error("Follower not found");

        const senderDetails = {
          _id: followerId,
          username: follower.username,
          profilePic: follower.profilePic || "placeholder.jpeg",
          fullName: follower.fullName,
        };

        const { notification, sender } = await storeNotification({
          userId: followingId,
          type: "follow",
          message: `${follower.username} started following you`,
          relatedId: followerId,
          relatedModel: "User",
          senderId: followerId,
          senderDetails,
        });

        if (notification) {
          io.to(followingId).emit("notification", {
            _id: notification._id,
            type: "follow",
            sender,
            content: `${follower.username} started following you`,
            read: false,
            timestamp: notification.createdAt,
          });
          console.log(
            `Emitted follow notification to ${followingId}:`,
            notification._id
          );
        }
      } catch (error) {
        console.error(`Error in followUpdate for ${followingId}:`, error);
      }
    });

    socket.on("disconnect", (reason) => {
      console.log(`User disconnected: ${userId}, Reason: ${reason}`);
      redis.sRem("onlineUsers", userId);
      io.emit("user_offline", { userId });
    });

    socket.on("error", (error) => {
      console.error(`Socket Error for user ${userId}:`, error);
    });
  });

  console.log("Socket.IO initialized and listeners attached.");
  return io;
}

async function updateMessageCache(messageId, senderId, receiverId, updates) {
  const SenderCacheKey = `messages:${senderId}:${receiverId}`;
  const receiverCacheKey = `messages:${receiverId}:${senderId}`;
  const messageKey = `message:${senderId}:${receiverId}:${messageId}`;

  const cachedMessage = await redis.get(messageKey);
  if (cachedMessage) {
    const updatedMessage = { ...JSON.parse(cachedMessage), ...updates };
    await redis.set(
      messageKey,
      JSON.stringify(updatedMessage),
      "EX",
      60 * 60 * 24 * 7
    );
  }

  let senderMessages = await redis.lRange(SenderCacheKey, 0, -1);
  if (senderMessages.length > 0) {
    senderMessages = senderMessages.map((msg) => JSON.parse(msg));
    const updatedSenderMessages = senderMessages.map((msg) =>
      msg._id.toString() === messageId.toString() ? { ...msg, ...updates } : msg
    );
    const multiSender = redis.multi();
    multiSender.del(SenderCacheKey);
    updatedSenderMessages.forEach((msg) =>
      multiSender.rPush(SenderCacheKey, JSON.stringify(msg))
    );
    multiSender.expire(SenderCacheKey, 60 * 60 * 24 * 7);
    await multiSender.exec();
  }

  let receiverMessages = await redis.lRange(receiverCacheKey, 0, -1);
  if (receiverMessages.length > 0) {
    receiverMessages = receiverMessages.map((msg) => JSON.parse(msg));
    const updatedReceiverMessages = receiverMessages.map((msg) =>
      msg._id.toString() === messageId.toString() ? { ...msg, ...updates } : msg
    );
    const multiReceiver = redis.multi();
    multiReceiver.del(receiverCacheKey);
    updatedReceiverMessages.forEach((msg) =>
      multiReceiver.rPush(receiverCacheKey, JSON.stringify(msg))
    );
    multiReceiver.expire(receiverCacheKey, 60 * 60 * 24 * 7);
    await multiReceiver.exec();
  }
}

export { io };
