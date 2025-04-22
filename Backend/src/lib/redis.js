import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Redis Client Initialize
const redis = createClient({
  url: process.env.REDIS_URL,
  socket: {
    tls: true,
  },
});

// Redis Connection Handling
redis.on("connect", () => console.log("Redis Connected Successfully!"));
redis.on("error", (err) => console.error(" Redis Error:", err));

// Redis ko manually connect karne ke liye
(async () => {
  try {
    await redis.connect();
  } catch (err) {
    console.error(" Redis Connection Failed:", err);
  }
})();

// ✅ Redis Export
export { redis };
