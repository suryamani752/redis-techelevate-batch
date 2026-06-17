const { getRedisClient } = require("../config/redis");

// @desc String operation demo
// @route GET /api/redis/string/demo

const stringDemo = async (req, res) => {
  try {
    const redis = getRedisClient();
    const results = {};

    // BASIC SET and GET
    await redis.set("greeting", "hello redis");
    results.basicGET = await redis.get("greeting");

    // SET with TTL (auto-expire, after 60 seconds)
    await redis.set("otp:user:1", "123456", "EX", 60);
    results.otpValue = await redis.get("otp:user:1");
    results.optTTL = await redis.ttl("otp:user:1");

    // Counter - page views
    await redis.set("product:1:views", "0");
    await redis.incr("product:1:views"); // +1
    await redis.incr("product:1:views"); // +1
    await redis.incr("product:1:views"); // +1
    results.pageViews = await redis.get("product:1:views");

    // incrby - add specific amount
    await redis.incrby("product:1:views", 10);
    results.pageViewsAfterAdd = await redis.get("product:1:views");

    // decr
    await redis.set("product:1:stock", 100);
    await redis.decr("product:1:stock");
    results.stockAfterDecr = await redis.get("product:1:stock");

    // mset - set multiple at one
    await redis.mset(
      "user:1:name",
      "satvik gupta",
      "user:1:email",
      "satvik@gmail.com",
      "user:1:age",
      "25",
    );

    // mget - get multiple at once
    results.multipleValues = await redis.mget(
      "user:1:name",
      "user:1:email",
      "user:1:age",
    );

    // exists - check if exists
    results.exists = await redis.exists("greeting");
    results.notExists = await redis.exists("nonexistent");

    // setnx - set only if not exists
    const setResult = await redis.setnx("lock:resource:1", "locked");
    results.setnx_first = setResult; // 1 = set successfully
    const setResult2 = await redis.setnx("lock:resource:1", "locked");
    results.setnx_second = setResult2; // 0 = already exists

    // getset - get old value, set new value
    const oldValue = await redis.getset("greeting", "hello updated redis");
    results.oldValue = oldValue;
    results.newValue = await redis.get("greeting");

    res.status(200).json({
      success: true,
      message: "string operations demo",
      useCases: {
        basicCaching: "simple key-value storage",
        ttlstorage: "OTP, token with auto expiry",
        counters: "page views, likes, downloads",
        flags: "Feature flags, boolean values",
      },
      results,
    });
  } catch (error) {}
};

module.exports = { stringDemo };
