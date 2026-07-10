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

// @desc Hash operation demo
// @route GET /api/redis/hash/demo
const hashDemo = async (req, res) => {
  try {
    const redis = getRedisClient();
    const results = {};

    // HSET - set fields
    await redis.hset("user:profile:1", {
      name: "Saumya Pradhan",
      email: "saumya@gmail.com",
      age: "22",
      city: "Dhenkanal",
      role: "user",
      joinedAt: new Date().toISOString(),
    });

    // HGET - get single field
    results.name = await redis.hget("user:profile:1", "name");
    results.email = await redis.hget("user:profile:1", "email");

    // HMGET - get multiple fields
    results.multipleFields = await redis.hmget(
      "user:profile:1",
      "name",
      "email",
      "city",
    );

    // HGETALL - get complete object
    results.completeProfile = await redis.hgetall("user:profile:1");

    // HEXISTS - check field exists
    results.nameExists = await redis.hexists("user:profile:1", "name");
    results.phoneExists = await redis.hexists("user:profile:1", "phone");

    // HKEYS - get all fields names
    results.fields = await redis.hkeys("user:profile:1");

    // HLEN - count fields
    results.fieldCount = await redis.hlen("user:profile:1");

    // HINCRBY - increment numeric field
    await redis.hset("user:profile:1", "loginCount", "0");
    await redis.hincrby("user:profile:1", "loginCount", 1);
    await redis.hincrby("user:profile:1", "loginCount", 1);
    await redis.hincrby("user:profile:1", "loginCount", 1);
    results.loginCount = await redis.hget("user:profile:1", "loginCount");

    // HDEL delete specific field
    await redis.hdel("user:profile:1", "city");
    results.afterDelete = await redis.hgetall("user:profile:1");

    // shopping cart with hash
    await redis.hset("cart:user:1", {
      "product:laptop": JSON.stringify({
        name: "Macbook",
        price: 150000,
        qty: 1,
      }),
      "product:phone": JSON.stringify({ name: "Iphone", price: 80000, qty: 2 }),
    });

    const cartRaw = await redis.hgetall("cart:user:1");
    results.cart = Object.fromEntries(
      Object.entries(cartRaw).map(([k, v]) => [k, JSON.parse(v)]),
    );
    res.status(200).json({
      success: true,
      message: "Hash operation Demo",
      useCases: {
        userProfile: "Multiple user field ek key mein",
        shoppingCart: "Cart items as hash fields",
        productDetails: "product info with fields",
        sessionData: "Session with multiple attributes",
      },
      results,
    });
  } catch (error) {}
};

// @desc List operation demo
// @route GET /api/redis/list/demo

const listDemo = async (req, res) => {
  try {
    const redis = getRedisClient();
    const results = {};

    // clear any previous data
    await redis.del(
      "queue:emails",
      "stack:undo",
      "feed:user:1",
      "recent:products:1",
    );

    // 1. QUEUE(FIFO) - Email Queue
    // RPUSH = add to end (enqueue)
    await redis.rpush(
      "queue:emails",
      JSON.stringify({
        to: "satvik@gmail.com",
        subject: "welcome",
        body: "welcome to out platform",
      }),
    );
    await redis.rpush(
      "queue:emails",
      JSON.stringify({
        to: "saumya@gmail.com",
        subject: "Order Confirmed",
        body: "your order #123 is confirmed",
      }),
    );
    await redis.rpush(
      "queue:emails",
      JSON.stringify({
        to: "satvikgupta@gmail.com",
        subject: "password reset",
        body: "click to reset password",
      }),
    );

    results.queueLength = await redis.llen("queue:emails");

    // LPOP = process from front (dequeue)
    const processedEmail = await redis.lpop("queue:emails");
    results.processedEmail = JSON.parse(processedEmail);
    results.remainingInQueue = await redis.llen("queue:emails");

    // 2. STACK (LIFO) undo operations
    // LPUSH = add to beginning
    await redis.lpush("stack:undo", "action1: deleted file");
    await redis.lpush("stack:undo", "action2: renamed folder");
    await redis.lpush("stack:undo", "action3: moved file");

    results.stackItems = await redis.lrange("stack:undo", 0, -1);

    // LPOP = GET most recent(top of stack)
    const lastAction = await redis.lpop("stack:undo");
    results.undoAction = lastAction;

    // 3. activity feed - timeline
    await redis.lpush(
      "feed:user:1",
      JSON.stringify({
        type: "like",
        user: "satvik",
        time: "2min ago",
      }),
    );
    await redis.lpush(
      "feed:user:1",
      JSON.stringify({
        type: "comment",
        user: "Saumya",
        time: "5min ago",
      }),
    );
    await redis.lpush(
      "feed:user:1",
      JSON.stringify({
        type: "follow",
        user: "Raj",
        time: "10min ago",
      }),
    );

    const feedRaw = await redis.lrange("feed:user:1", 0, -1);
    results.activityFeed = feedRaw.map((item) => JSON.parse(item));

    // 4. recent products (limit to last 5)
    const products = [
      "laptop",
      "phone",
      "tablet",
      "watch",
      "earbuds",
      "keyword",
    ];
    for (const product of products) {
      await redis.lpush("recent:products:1", product);
    }
    // keep only last 5
    await redis.ltrim("recent:products:1", 0, 4);
    results.recentProducts = await redis.lrange("recent:products:1", 0, -1);

    // LRANGE - get specific range
    results.first2Items = await redis.lrange("recent:products:1", 0, 1);
    results.last2Items = await redis.lrange("recent:products:1", -2, -1);

    // LLEN - length
    results.feedLength = await redis.llen("feed:user:1");

    // LINDEX - get item at specific position
    results.itemAt0 = await redis.lindex("recent:products:1", 0);
    results.itemAt2 = await redis.lindex("recent:products:1", 2);

    res.status(200).json({
      success: true,
      message: "List Operations Demo",
      useCases: {
        queue: "FIFO: Email/notification processing queue",
        stack: "LIFO: undo operations, browser history",
        feed: "activity timeline, news feed",
        recent: "recently viewed items(with LTRIM)",
      },
      results,
    });
  } catch (error) {}
};

// @desc SET operation demo
// @route GET /api/redis/set/demo
const setDemo = async (req, res) => {
  try {
    const redis = getRedisClient();
    const results = {};

    // clear previous data
    await redis.del(
      "online:users",
      "tags:product:1",
      "tags:product:2",
      "friends:user:1",
      "friends:user:2",
      "blocked:user:1",
    );

    // 1. online users - Track who is online
    await redis.sadd(
      "online:users",
      "user:1",
      "user:2",
      "user:3",
      "user:4",
      "user:5",
    );
    results.onlineCount = await redis.scard("online:users");
    results.onelineUsers = await redis.smembers("online:users");

    // user come online
    await redis.sadd("online:users", "user:6");
    //user goes offline
    await redis.srem("online:users", "user:3");
    results.updatedOnlineUsers = await redis.smembers("online:users");

    // 2. check if specific user is online
    results.isUser1Online = await redis.sismember("online:users", "user:1");
    results.isUser3Online = await redis.sismember("online:users", "user:3");

    // 3. product tags
    await redis.sadd(
      "tags:product:1",
      "electronics",
      "mobile",
      "apple",
      "premium",
    );
    await redis.sadd(
      "tags:product:2",
      "electronics",
      "laptop",
      "apple",
      "macbook",
    );
    await redis.sadd(
      "tags:product:3",
      "clothing",
      "casual",
      "winter",
      "summer",
    );
    results.product1Tags = await redis.smembers("tags:product:1");

    // 4. set operations
    // SUNION - all tags from product 1 and 2
    results.unionTags = await redis.sunion("tags:product:1", "tags:product:2");
    // SINTER - common tags (both products)
    results.commonTags = await redis.sinter("tags:product:1", "tags:product:2");
    // SDIFF - tags only in product 1 (not in product 2)
    results.commonTags = await redis.sinter("tags:product:1", "tags:product:2");

    // 5. Friend network
    await redis.add("friends:user:1", "user:2", "user:3", "user:4");
    await redis.add("friends:user:2", "user:1", "user:3", "user:5", "user:6");

    // mutual friends(intersection)
    results.mutualFriends = await redis.sinter(
      "friends:user:1",
      "friends:user:2",
    );

    // friend suggestion (user:2's friends that user:1 does'nt know)
    results.suggestions = await redis.sdiff("friends:user:2", "friends:user:1");

    // blocked users
    await redis.sadd("blocked:user:1", "user:99", "user:88");
    results.isBlockedUser99 = await redis.sismember(
      "blocked:user:1",
      "user:99",
    );
    results.isBlockedUser2 = await redis.sismember("blocked:user:1", "user:2");

    // random member (for features like suggest a friend)
    results.randomFriend = await redis.srandmember("friend:user:1");

    // duplicate prevention demo
    await redis.add("unique:visits", "ip:1.1.1.1");
    await redis.add("unique:visits", "ip:2.2.2.2");
    await redis.add("unique:visits", "ip:1.1.1.1"); // duplicate -> won't be added
    await redis.add("unique:visits", "ip:3.3.3.3");

    results.uniqueVisitors = await redis.scard("unique:visits"); // 3, not 4

    res.status(200).json({
      success: true,
      message: "set operation demo",
      useCases: {
        onlineUsers: "Track who is currently online",
        tags: "product/content tagging (unique)",
        friendNetwork: "social graph, mutual connections",
        accessControl: "blocked users, permissions",
        uniqueTracking: "unique visitors, deduplicated data",
      },
      results,
    });
  } catch (error) {}
};

// @desc Sorted set operations demo
// @route GET /api/redis/zset/demo

const zsetDemo = async (req, res) => {
  try {
    const redis = getRedisClient();
    const results = {};

    // clear previous data
    await redis.del(
      "leaderboard:global",
      "priority:tasks",
      "trending:products",
    );

    // 1. leaderboard - game score
    await redis.zadd(
      "leaderboard:global",
      100,
      "satvik",
      85,
      "Saumya",
      95,
      "Rahul",
      78,
      "Amit",
      110,
      "Raj",
      92,
      "Sneha",
    );

    // get top 3 (highest score)
    const top3 = await redis.zrevrange(
      "leaderboard:global",
      0,
      2,
      "WITHSCORES",
    );
    const top3 = [110, "raj", 100, "satvik", 95, "raj"];
    results.top3Players = [];
    for (let i = 0; i < top3.length; i += 2) {
      results.top3Players.push({
        rank: Math.floor(i / 2) + 1, // 1, 2, 3
        player: top3[i + 1], // raj, satvik, raj
        score: parseInt(top3[i]), // 110, 100, 95
      });
    }

    // get player rank
    const rahulRank = await redis.zrevrank("leaderboard:global", "Rahul");
    results.rahulRank = rahulRank + 1; // 0 based to 1-based
  } catch (error) {}
};

module.exports = { stringDemo, hashDemo, listDemo, setDemo };
