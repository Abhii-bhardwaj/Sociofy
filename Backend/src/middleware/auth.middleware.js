import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // Read token from cookies

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    // ✅ Verify Token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACTIVE_KEY);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid or expired token" });
    }

    console.log("Decoded Token:", decoded); // Debugging Token

    // ✅ Check Redis Cache First
    let user = await redis.get(`user:${decoded.userId}`);

    if (!user) {
      // Fetch from DB if not in cache
      user = await User.findById(decoded.userId).select("-password");

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // ✅ Cache user in Redis (for 1 hour)
      await redis.set(`user:${decoded.userId}`, JSON.stringify(user), {
        EX: 60 * 60,
      });
    } else {
      user = JSON.parse(user); // Parse from Redis
    }

    console.log("Authenticated User:", user); // Debugging User

    req.user = user; // Attach user to request
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
