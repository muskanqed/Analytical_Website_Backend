const express = require('express');
const { authenticate } = require('../middleware/authMiddleware');
const { 
  getWebsiteStats,
  getSessionAnalytics,
  getPageViewAnalytics,
  getEventAnalytics,
  getTimeSeriesData
} = require('../controllers/analyticsController');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Rate limiting configuration
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply authentication and rate limiting to all analytics routes
router.use(authenticate, analyticsLimiter);

// Main website statistics endpoint
router.get('/stats/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const stats = await getWebsiteStats(websiteId);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Session analytics endpoint
router.get('/sessions/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { start, end } = req.query;
    
    const sessions = await getSessionAnalytics(websiteId, { start, end });
    res.json(sessions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Page view analytics endpoint
router.get('/pageviews/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { path, referrer } = req.query;
    
    const pageViews = await getPageViewAnalytics(websiteId, { path, referrer });
    res.json(pageViews);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Event analytics endpoint
router.get('/events/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { type } = req.query;
    
    const events = await getEventAnalytics(websiteId, type);
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Time series data endpoint
router.get('/timeseries/:websiteId', async (req, res) => {
  try {
    const { websiteId } = req.params;
    const { start, end, interval = 'day' } = req.query;
    
    const timeSeries = await getTimeSeriesData(websiteId, { 
      start, 
      end, 
      interval 
    });
    
    res.json(timeSeries);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
