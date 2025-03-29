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
import "./services/passport.js";
import { connectDB } from "./lib/db.js";
import { generateToken } from "./lib/utils.js";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());

app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  })
);

app.use(
  session({
    store: new RedisStore({ client: redis }),
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Socket.IO Authentication Middleware
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("Authentication error: No token"));
  try {
    const { jwt } = await import("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_ACTIVE_KEY);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

// Socket.IO Logic

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.user.id}`);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log(`${socket.user.id} joined chat: ${chatId}`);
  });

  socket.on("sendMessage", async (message) => {
    const { chatId, content, receiverId } = message;
    const senderId = socket.user.id;

    const messageData = {
      senderId,
      receiverId,
      content,
      chatId,
      timestamp: new Date().toISOString(),
    };

    // Save to MongoDB
    const newMessage = new Message({
      senderId,
      receiverId,
      content,
      chatId,
    });
    await newMessage.save();

    // Update User.chats for both sender and receiver
    await User.updateOne(
      { _id: senderId },
      { $push: { chats: { chatId, lastMessage: newMessage._id } } },
      { upsert: true }
    );
    await User.updateOne(
      { _id: receiverId },
      { $push: { chats: { chatId, lastMessage: newMessage._id } } },
      { upsert: true }
    );

    // Cache in Redis
    const cacheKey = `message:${chatId}:${Date.now()}`;
    await redis.setEx(cacheKey, 3600, JSON.stringify(messageData));

    // Create Notification
    await new Notification({
      userId: receiverId,
      type: "message",
      message: `${senderId} sent you a message`,
      relatedId: newMessage._id,
      relatedModel: "Message",
      senderId,
    }).save();

    // Emit to chat room
    io.to(chatId).emit("receiveMessage", messageData);
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.user.id}`);
  });
});

const PORT = process.env.PORT || 5001;

app.use("/api/auth", authRoutes);
app.use("/api/post", postRoutes);
app.use("/api/user", userRoutes);
app.use("/api/messages", messageRoutes);

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
