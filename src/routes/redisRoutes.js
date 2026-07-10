const express = require("express");
const {
  stringDemo,
  hashDemo,
  listDemo,
  setDemo,
} = require("../controllers/redisController");
const router = express.Router();

router.get("/string/demo", stringDemo);
router.get("/hash/demo", hashDemo);
router.get("/list/demo", listDemo);
router.get("/set/demo", setDemo)

module.exports = router;
