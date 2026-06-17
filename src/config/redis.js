const Redis = require("ioredis");

let client = null;

// Redis client create
const createRedisClient = () => {
  const redisConfig = {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: 0,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 10) return null;
      return Math.min(times * 100, 3000);
    },
    lazyConnect: false,
  };

  const redis = new Redis(redisConfig);

  // events
  redis.on("connect", () => {
    console.log("redis connecting.....");
  });
  redis.on("ready", () => {
    console.log("redis ready");
  });
  redis.on("error", (err) => {
    console.log("redis error", err.message);
  });
  redis.on("close", () => {
    console.log("redis closed");
  });
  redis.on("reconnecting", () => {
    console.log("Redis reconnecting......");
  });

  return redis;
};

// singleton
const getRedisClient = () => {
  if (!client) {
    client = createRedisClient();
  }
  return client;
};

const closeRedis = async () => {
  if (client) {
    await client.quit();
    client = null;
  }
};

module.exports = { getRedisClient, closeRedis };
