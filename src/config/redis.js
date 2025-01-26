const Redis = require("ioredis");

const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379,
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
};

class RedisClient {
  static instance;

  constructor() {
    if (!RedisClient.instance) {
      RedisClient.instance = new Redis(redisConfig);
      this.registerEvents();
    }
  }

  registerEvents() {
    RedisClient.instance
      .on("connect", () => console.log("Redis connected"))
      .on("ready", () => console.log("Redis ready"))
      .on("error", (err) => console.error("Redis error:", err))
      .on("reconnecting", () => console.log("Redis reconnecting"))
      .on("end", () => console.log("Redis connection closed"));
  }

  getClient() {
    return RedisClient.instance;
  }
}

const redis = new RedisClient().getClient();

module.exports = redis;
