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
import helmet from "helmet";

import { initSocket } from './lib/socket.js'; // Adjust path if needed

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const server = http.createServer(app);

const io = initSocket(server);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.VITE_APP_URL || "https://sociofy-ynkj.onrender.com",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
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

app.use(helmet());

app.use("/auth", authRoutes);
app.use("/post", postRoutes);
app.use("/user", userRoutes);
app.use("/messages", messageRoutes);
app.use("/notifications", notificationRoutes);
app.use("/admin", adminRoutes);
app.use("/chatbot", chatbotRoutes);

const PORT = process.env.PORT || 5001;

app.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);


app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.VITE_APP_URL}/login` || "http://localhost:5173/login",
  }),
  async (req, res) => {
    try {
      if (!req.user || !req.user.user || !req.user.userData) {
        console.error(
          "Authentication failed: req.user or req.user.user is undefined",
          req.user
        );
        return res.redirect(`${process.env.VITE_APP_URL}/login` || "http://localhost:5173/login");
      }

      const { user, userData } = req.user;

      // Generate JWT token
      try {
        await generateToken(user._id, res);
        console.log("JWT token generated for user:", user._id);
      } catch (tokenError) {
        console.error("Error generating JWT token:", tokenError.message);
        throw new Error("Token generation failed");
      }

      // Store userData in session (optional, for frontend access)
      req.session.userData = userData;
      console.log("Session userData stored:", userData);

      // Redirect to frontend
      res.redirect( `${process.env.VITE_APP_URL}/` || "http://localhost:5173/");
    } catch (error) {
      console.error("Error in Google OAuth callback:", error.message);
      res.redirect(`${process.env.VITE_APP_URL}/login` || "http://localhost:5173/login");
    }
  }
);

// Error handling middleware (optional, for debugging)
app.use((err, req, res, next) => {
  console.error("Server Error:", err.message);
  res.status(500).json({ message: "Server error" });
});

server.listen(PORT, () => {
  // Changed to server.listen
  console.log(`🚀 Server started on port ${PORT}`);
  console.log("CORS origins:", [
    process.env.VITE_APP_URL || "http://localhost:5173",
    "https://sociofy-frontend.onrender.com",
  ]);
  connectDB();
});
