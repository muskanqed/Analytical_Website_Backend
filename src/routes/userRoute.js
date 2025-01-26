const express = require("express");
const {
  createUser,
  loginUser,
  getUsers,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/users", authenticate, getUsers);

module.exports = router;
