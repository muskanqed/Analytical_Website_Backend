const express = require("express");
const {
  createUser,
  loginUser,
  getUsers,
  getUser,
} = require("../controllers/userController");
const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", createUser);
router.post("/login", loginUser);
router.get("/users", authenticate, getUsers);
router.get("/me", authenticate, getUser);

module.exports = router;
