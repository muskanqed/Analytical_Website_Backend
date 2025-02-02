const prisma = require("../utils/prismaClient");

const jwt = require("jsonwebtoken");
const { comparePassword, hashPassword } = require("../services/bcryptService");
const { generateToken } = require("../services/authService");

const createUser = async (req, res) => {
  const data = req.body;
  try {
    const hashedPassword = await hashPassword(data.password);
    const user = await prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
    const token = generateToken(user);

    res.json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error creating user", message: error.message });
    console.error("Error creating user:", error);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await comparePassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "4d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Error logging in" });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Error fetching users" });
  }
};

const getUser = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
      },
    });
    return res.status(200).json({
      user,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching user",
    });
  }
};

module.exports = { createUser, loginUser, getUsers, getUser };
