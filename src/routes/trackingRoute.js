const express = require('express');
const { prisma } = require('../utils/prisma');
const { parseUserAgent } = require('../utils/userAgent');
const { getClientGeo } = require('../utils/geo');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/track', async (req, res) => {
  try {
    const {
      sessionId,
      websiteId,
      type,
      data,
      url,
      referrer,
      screen
    } = req.body;

    if (!websiteId || !type) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const userAgent = parseUserAgent(req.headers['user-agent'] || '');
    const geo = getClientGeo(req);

    const session = await prisma.session.upsert({
      where: { id: sessionId },
      create: {
        id: sessionId || uuidv4(),
        websiteId,
        userAgent: JSON.stringify(userAgent),
        country: geo.country,
        region: geo.region,
        city: geo.city,
        deviceType: userAgent.device.type,
        os: userAgent.os.name,
        browser: userAgent.browser.name,
        screen: screen || '0x0',
        language: req.headers['accept-language'] || '',
      },
      update: {
        lastActivity: new Date(),
      },
    });

    // Event processing
    if (type === 'pageview') {
      await prisma.pageView.create({
        data: {
          sessionId: session.id,
          url,
          referrer,
        }
      });
    } else {
      await prisma.event.create({
        data: {
          sessionId: session.id,
          type,
          data: data || {},
        }
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Tracking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
