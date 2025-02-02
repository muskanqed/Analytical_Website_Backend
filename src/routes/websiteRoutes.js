const express = require("express");
const { getUserWebsites } = require("../controllers/websiteController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/get", authenticate, getUserWebsites);

module.exports = router;
