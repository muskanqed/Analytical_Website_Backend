const express = require("express");
const prisma = require("../utils/prismaClient");
const { parseUserAgent } = require("../utils/userAgent");
const { getClientGeo } = require("../utils/geo");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

router.post("/track", async (req, res) => {
  try {
    const {
      type,
      sessionId,
      url,
      referrer,
      screen,
      language,
      timezone,
      websiteId,
      userAgent,
      eventType,
      element,
      id,
      path,
      class: className,
      text,
      href,
    } = req.body;

    if (!websiteId || !type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const parsedUserAgent = parseUserAgent(userAgent);

    const geo = getClientGeo(req);
    console.log(eventType);
    const session = await prisma.session.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId || uuidv4(),
        websiteId,
        userAgent: JSON.stringify(userAgent),
        country: geo.country,
        region: geo.region,
        city: geo.city,
        deviceType: parsedUserAgent?.device?.type,
        os: parsedUserAgent.os.name,
        browser: parsedUserAgent.browser.name,
        screen: screen || "0x0",
        language: language || "",
        lastActivity: new Date(),
      },
      update: {
        lastActivity: new Date(),
      },
    });

    if (!session) {
      return req.statusCode(401).json({
        error: "session not found",
      });
    }

    // Event processing
    if (type === "pageview") {
      await prisma.pageView.create({
        data: {
          sessionId: session.id,
          url: url || "vedant@gmail.com",
          path: typeof path === "string" ? path : href || "",
          referrer,
        },
      });
    } else {
      const eventData = {
        eventType: type,
        referrer,
        element: element,
        id: id,
        class: className, // The CSS classes applied to the element
        text: text, // The text content of the element, truncated
        href: href, // The href attribute if the element is a link
        timestamp: Date.now(), // Timestamp of the event (optional)
      };

      await prisma.event.create({
        data: {
          sessionId: session.id,
          type,
          path,
          data: eventData || {},
        },
      });
    }

    res.status(200).send("OK");
  } catch (error) {
    console.error("Tracking error:", error.message);
    return res
      .status(500)
      .json({ error: "Internal server error", message: error.message });
  }
});

module.exports = router;
