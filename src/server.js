const formatUptime = require("./utils/formatUptime.js");

const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan"); // logging middleware
const bodyParser = require("body-parser");
const userRoutes = require("./routes/userRoute");
const analyticsRoutes = require("./routes/analyticsRoutes");
const websitesRoutes = require("./routes/websiteRoutes.js");
const trackingRoutes = require("./routes/trackingRoutes.js");
const { globalLimiter } = require("./utils/rateLimiter");
const errorHandler = require("./middleware/errorMiddleware");
const { setupWebSocket } = require("./services/websocketService");
const prisma = require("./utils/prismaClient");
const path = require("path");


dotenv.config({}); // to load the envs


const app = express();
const PORT = process.env.PORT || 5000;

// Database connection check
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log("Database connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

// Middleware
app.use(globalLimiter);
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);
app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());
app.use(morgan("combined"));
app.set("trust proxy", true);
app.use(express.static(path.join(__dirname, "static")));

// Routes
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/analytics", analyticsRoutes);
app.use("/api/v1/websites", websitesRoutes);
app.use("/api/v1", trackingRoutes);

// Health Check endpoint
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    ip: req.headers,
    uptime: formatUptime(process.uptime()),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
  });
});

// Error handling
app.use(errorHandler);
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found", href: "/api/v1/health" });
});

// Start server with WebSocket support
const startServer = async () => {
  await checkDatabaseConnection();

  const server = app.listen(PORT, () => {
    console.log(
      `Server is running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });

  setupWebSocket(server);
};

startServer();
