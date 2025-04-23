import jwt from "jsonwebtoken";
import { redis } from "./redis.js";

export const generateToken = async (userId, res) => {
  try {
    const token = jwt.sign({ userId }, process.env.JWT_ACTIVE_KEY, {
      expiresIn: "24h",
    });

    // ✅ Redis me token store karne ka sahi tareeka
    await redis.set(`token:${userId}`, token, {
      EX: 1 * 24 * 60 * 60, // 1 din ke liye expire hoga
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "None",
      secure: process.env.NODE_ENV !== "development",
      path: "/",
    });

    console.log("Token generated: ", token);

    return token;
  } catch (err) {
    console.error(" Redis Token Store Error:", err);
    throw new Error("Failed to generate token"); // 🔥 Ensure failure is caught in `signup`
  }
};
