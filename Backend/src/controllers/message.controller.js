import  User  from "../models/user.model.js";
import { redis } from "../lib/redis.js";

export const getChatList = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch followers from DB (assuming User model mein followers array hai)
    const user = await User.findById(userId).populate(
      "followers",
      "email profilePic"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // Fetch interacted users (e.g., from message history stored in Redis or DB)
    const interactedKeys = await redis.keys(`message:${userId}:*`);
    const interactedUsers = await Promise.all(
      interactedKeys.map(async (key) => {
        const message = JSON.parse(await redis.get(key));
        return { id: message.userId, name: message.userId }; // Replace with actual user lookup if needed
      })
    );

    // Combine followers and interacted users, remove duplicates
    const chatList = [
      ...user.followers.map((f) => ({
        id: f._id.toString(),
        name: f.email.split("@")[0], // Temporary name logic
        profilePic: f.profilePic,
      })),
      ...interactedUsers,
    ].filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

    res.status(200).json(chatList);
  } catch (error) {
    console.error("Error fetching chatlist:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const fetchInitialMessage = async (req, res) => {
  try {
    const { chatId } = req.params;
    const keys = await redis.keys(`message:${chatId}:*`);
    const messages = await Promise.all(
      keys.map(async (key) => JSON.parse(await redis.get(key)))
    );
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};
