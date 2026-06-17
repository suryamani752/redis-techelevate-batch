const express = require("express");
const { stringDemo } = require("../controllers/redisController");
const router = express.Router();


router.get("/string/demo", stringDemo);

module.exports = router;
