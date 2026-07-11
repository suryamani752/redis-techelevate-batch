const express = require("express");
const {
  stringDemo,
  hashDemo,
  listDemo,
  setDemo,
  zsetDemo,
} = require("../controllers/redisController");
const router = express.Router();

router.get("/string/demo", stringDemo);
router.get("/hash/demo", hashDemo);
router.get("/list/demo", listDemo);
router.get("/set/demo", setDemo);
router.get("/zset/demo", zsetDemo);

module.exports = router;
