// src/services/prismaClient.js
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function shutdown() {
  // database connection disconnection
  await prisma.$disconnect();
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = prisma;
