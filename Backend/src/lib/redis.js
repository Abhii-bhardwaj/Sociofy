import { createClient } from "redis";

// Redis Client Initialize
const redis = createClient({
  socket: {
    host: "127.0.0.1", // Localhost pe Redis chala raha hai
    port: 6379, // Redis ka default port
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
