import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    const token = req.cookies.jwt; // Token from cookies
    if (!token && req.headers.authorization) {
      token = req.headers.authorization.split("Bearer ")[1]; // Fallback to header
    }
    console.log(token);
    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACTIVE_KEY);
    } catch (err) {
      return res
        .status(401)
        .json({ message: "Unauthorized - Invalid or expired token" });
    }

    console.log("Decoded Token:", decoded); // { userId: "67ee7ee313eb430ee643558f", ... }

    let user = await redis.get(`user:${decoded.userId}`);
    if (!user) {
      user = await User.findById(decoded.userId).select("-password");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      await redis.set(`user:${decoded.userId}`, JSON.stringify(user), {
        EX: 60 * 60,
      });
    } else {
      user = JSON.parse(user);
    }

    console.log("Authenticated User:", user); // Debugging User

    req.user = {
      userId: decoded.userId, // From token
      ...user, // Spread the rest of the user object
    };
    console.log("req.user set:", req.user); // Attach user to request
    next();
  } catch (error) {
    console.error("Error in protectRoute middleware:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
