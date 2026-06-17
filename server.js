require("dotenv").config();

const express = require("express");
const { connectDatabases } = require("./src/config/database");
const { closeRedis } = require("./src/config/redis");
const redisRoutes = require("./src/routes/redisRoutes");

const app = express();

app.use(express.json());
app.use("/api/redis", redisRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDatabases();

  app.listen(PORT, () => {
    console.log("server is running");
  });

  // graceful shutdown
  process.on("SIGINT", async () => {
    console.log("shutting down....");
    await closeRedis();
    process.exit(0);
  });
};
startServer();
