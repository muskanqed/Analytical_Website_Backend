const prisma = require("../utils/prismaClient");

const getUserWebsites = async (req, res) => {
  try {
    const userId = req.userId;
    const websites = await prisma.website.findMany({
      where: {
        ownerId: userId,
      },
    });
    return res.status(200).json({
      websites,
    });
  } catch (error) {
    res.status(500).json({
      error: "Error fetching user",
    });
  }
};

module.exports = { getUserWebsites };
