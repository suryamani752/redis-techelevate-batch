const mongoose = require("mongoose");
const { getRedisClient } = require("./redis");

// mongodb connection
const connectMongoDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`Database: ${conn.connection.name}`);
  } catch (error) {
    process.exit(1);
  }
};

// redis connection
const connectRedis = async () => {
  try {
    let client = getRedisClient();

    // test connection
    const pong = await client.ping();

    if (pong === "PONG") {
      console.log("redis connected successfully");
      console.log(
        `Host: ${process.env.REDIS_HOST}:${process.env.REDIS_PORT}\n`,
      );
    }
  } catch (error) {
    console.error("redis connection error");
    process.exit(1);
  }
};

// connect all databases
const connectDatabases = async () => {
  console.log("connecting to database.....");
  await connectMongoDB();
  await connectRedis();
  console.log("all database connected");
};

module.exports = {
  connectMongoDB,
  connectRedis,
  connectDatabases,
};
