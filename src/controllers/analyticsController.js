const prisma = require("../utils/prismaClient");
const { validateTimeRange, validateInterval } = require("../utils/validation");

const getWebsiteStats = async (websiteId) => {
  try {
    const [sessions, pageViews, events, durationResult] = await Promise.all([
      prisma.session.count({ where: { websiteId } }),
      prisma.pageView.count({
        where: { session: { websiteId } },
      }),
      prisma.event.count({
        where: { session: { websiteId } },
      }),
      prisma.$queryRaw`
SELECT 
    AVG(EXTRACT(EPOCH FROM (sub."lastActivity" - sub."createdAt"))/60) AS avg_duration,
    COUNT(*) FILTER (WHERE sub.page_view_count = 1) AS bounce_sessions
    FROM (
        SELECT 
            s.id,
            s."createdAt",
            s."lastActivity",
            COUNT(pv.id) AS page_view_count
        FROM "Session" s
        LEFT JOIN "PageView" pv ON s.id = pv."sessionId"
        WHERE s."websiteId" = ${websiteId}
        GROUP BY s.id, s."createdAt", s."lastActivity"
    ) sub;
`,
    ]);

    const { avg_duration, bounce_sessions } = durationResult[0];
    const totalSessions = parseInt(sessions, 10);

    return {
      sessions,
      pageViews,
      events,
      avgDuration: Math.round(avg_duration * 100) / 100,
      bounceRate: (Number(bounce_sessions) / totalSessions) * 100 || 0,
      avgPagesPerSession: pageViews / totalSessions || 0,
    };
  } catch (error) {
    console.error("Analytics query failed:", error);
    throw new Error("Failed to generate website statistics");
  }
};

const getSessionAnalytics = async (websiteId, filters = {}) => {
  try {
    const { start, end } = filters;

    return await prisma.session.findMany({
      where: {
        websiteId,
        createdAt: {
          ...(start && { gte: new Date(start) }),
          ...(end && { lte: new Date(end) }),
        },
      },
      include: {
        pageViews: {
          select: { url: true, createdAt: true },
        },
        events: {
          select: { type: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching session analytics:", error);
    throw new Error("Failed to retrieve session data");
  }
};

const getPageViewAnalytics = async (websiteId, filters = {}) => {
  try {
    const { path, referrer, start, end } = filters;

    return await prisma.pageView.findMany({
      where: {
        session: { websiteId },
        ...(path && { url: { contains: path } }),
        ...(referrer && { referrer: { contains: referrer } }),
        createdAt: {
          ...(start && { gte: new Date(start) }),
          ...(end && { lte: new Date(end) }),
        },
      },
      include: {
        session: {
          select: {
            country: true,
            deviceType: true,
            browser: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching page view analytics:", error);
    throw new Error("Failed to retrieve page view data");
  }
};

const getEventAnalytics = async (websiteId, filters = {}) => {
  try {
    const { type, start, end } = filters;

    return await prisma.event.findMany({
      where: {
        session: { websiteId },
        ...(type && { type }),
        createdAt: {
          ...(start && { gte: new Date(start) }),
          ...(end && { lte: new Date(end) }),
        },
      },
      include: {
        session: {
          select: {
            country: true,
            deviceType: true,
            browser: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Error fetching event analytics:", error);
    throw new Error("Failed to retrieve event data");
  }
};

const getTimeSeriesData = async (websiteId, filters = {}) => {
  try {
    const { start, end, interval = "day" } = filters;

    // Validate input parameters
    validateTimeRange(start, end);
    const validInterval = validateInterval(interval);

    return await prisma.$queryRaw`
      WITH time_series AS (
        SELECT 
          date_trunc(${validInterval}, 
            generate_series(
              ${new Date(start)}, 
              ${new Date(end)}, 
              ${`1 ${validInterval}`}::interval
            )
          ) AS timestamp
      )
      SELECT
        ts.timestamp,
        COUNT(s.id) AS sessions,
        COUNT(pv.id) AS pageviews,
        COUNT(e.id) AS events
      FROM time_series ts
      LEFT JOIN "Session" s 
        ON date_trunc(${validInterval}, s.created_at) = ts.timestamp
        AND s.website_id = ${websiteId}
      LEFT JOIN "PageView" pv ON s.id = pv.session_id
      LEFT JOIN "Event" e ON s.id = e.session_id
      GROUP BY ts.timestamp
      ORDER BY ts.timestamp ASC
    `;
  } catch (error) {
    console.error("Error generating time series data:", error);
    throw new Error("Failed to generate time series analytics");
  }
};

module.exports = {
  getWebsiteStats,
  getSessionAnalytics,
  getPageViewAnalytics,
  getEventAnalytics,
  getTimeSeriesData,
};
