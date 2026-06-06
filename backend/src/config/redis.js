import { createClient } from "redis";

const redisPort = Number(process.env.REDIS_PORT || 6379);

if (!Number.isInteger(redisPort) || redisPort < 0 || redisPort >= 65536) {
  throw new Error(
    "Invalid REDIS_PORT. Expected a number between 0 and 65535."
  );
}

export const redis = createClient({
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,

  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: redisPort,
    reconnectStrategy: false,
  },
});

redis.on("error", (err) => {
  console.log("Redis Error:", err);
});

(async () => {
  try {
    await redis.connect();
    console.log("Redis Connected ✅");
  } catch (err) {
    console.log("Failed to connect to Redis:", err);
  }
})();