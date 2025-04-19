import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import passport from "passport";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { redis } from "./lib/redis.js";
import { Server } from "socket.io"; // Fixed typo
import http from "http";
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import messageRoutes from "./routes/message.route.js";
import notificationRoutes from "./routes/notification.route.js"
import adminRoutes from "./routes/admin.route.js";
import chatbotRoutes from "./routes/chatbot.route.js"
import "./services/passport.js";
import { connectDB } from "./lib/db.js";
import { generateToken } from "./lib/utils.js";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";

import { initSocket } from './lib/socket.js'; // Adjust path if needed

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = initSocket(server);
// const io = new Server(server, {
//   cors: {
//     origin: ["http://localhost:5173"],
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
//   pingTimeout: 20000,
//   pingInterval: 25000,
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // Use secure cookies in production
      httpOnly: true, // Prevent client-side script access
      maxAge: 1000 * 60 * 60 * 24, // Example: 1 day session expiry
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chatbot", chatbotRoutes);

// // Socket.IO Authentication Middleware
// io.use(async (socket, next) => {
//   const token = socket.handshake.auth.token || socket.request.cookies.token;
//   console.log("Socket Handshake Token Received:", token);

//   if (!token) {
//     console.log("No token provided, rejecting connection");
//     return next(new Error("Authentication error: No token"));
//   }

//   try {
//     console.log("JWT_ACTIVE_KEY:", process.env.JWT_ACTIVE_KEY); // Debug secret key
//     const decoded = jwt.verify(token, process.env.JWT_ACTIVE_KEY);
//     console.log("Decoded Token:", decoded);
//     socket.user = decoded;
//     next();
//   } catch (err) {
//     console.error("Token verification failed:", err.message);
//     next(new Error("Authentication error: Invalid token"));
//   }
// });

// // Socket.IO Logic
// io.on("connection", (socket) => {
//   console.log(`User connected: ${socket.user.userId}`);

//   socket.on("joinChat", (chatId) => {
//     socket.join(chatId);
//     console.log(`${socket.user.userId} joined chat: ${chatId}`);
//   });

//   socket.on("sendMessage", async (message) => {
//     const { chatId, content, receiverId } = message;
//     const senderId = socket.user.userId;

//     const messageData = {
//       senderId,
//       receiverId,
//       content,
//       chatId,
//       timestamp: new Date().toISOString(),
//     };

//     // Save to MongoDB
//     const newMessage = new Message({
//       senderId,
//       receiverId,
//       content,
//       chatId,
//     });
//     await newMessage.save();

//     // Update User.chats for both sender and receiver
//     await User.updateOne(
//       { _id: senderId },
//       { $push: { chats: { chatId, lastMessage: newMessage._id } } },
//       { upsert: true }
//     );
//     await User.updateOne(
//       { _id: receiverId },
//       { $push: { chats: { chatId, lastMessage: newMessage._id } } },
//       { upsert: true }
//     );

//     // Cache in Redis
//     const cacheKey = `message:${chatId}:${Date.now()}`;
//     await redis.setEx(cacheKey, 3600, JSON.stringify(messageData));

//     // Create Notification
//     await new Notification({
//       userId: receiverId,
//       type: "message",
//       message: `${senderId} sent you a message`,
//       relatedId: newMessage._id,
//       relatedModel: "Message",
//       senderId,
//     }).save();

//     // Emit to chat room
//     io.to(chatId).emit("receiveMessage", messageData);
//   });

//   socket.on("disconnect", () => {
//     console.log(`User disconnected: ${socket.user.userId}`);
//   });
// });

// export { io };

const PORT = process.env.PORT || 5001;

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "http://localhost:5173/login",
  }),
  async (req, res) => {
    try {
      if (!req.user || !req.user.user) {
        return res.status(401).json({ message: "Authentication failed" });
      }
      await generateToken(req.user.user._id, res);
      res.redirect("http://localhost:5173/");
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      res.redirect("http://localhost:5173/login");
    }
  }
);

server.listen(PORT, () => {
  // Changed to server.listen
  console.log(`🚀 Server started on port ${PORT}`);
  connectDB();
});
