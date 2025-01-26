const { redis } = require("../config/redis");

const CHANNELS = {
  PAGE_VIEWS: "analytics:pageviews",
  EVENTS: "analytics:events",
  SESSIONS: "analytics:sessions",
};

const publishAnalyticsEvent = (type, data) => {
  const channel = {
    pageview: CHANNELS.PAGE_VIEWS,
    event: CHANNELS.EVENTS,
    session: CHANNELS.SESSIONS,
  }[type];

  if (!channel) {
    throw new Error(`Invalid event type: ${type}`);
  }

  return redis.publish(channel, JSON.stringify(data));
};

const subscribeToAnalytics = (callback) => {
  const subscriber = redis.duplicate();

  subscriber.subscribe(
    CHANNELS.PAGE_VIEWS,
    CHANNELS.EVENTS,
    CHANNELS.SESSIONS,
    (err) => {
      if (err) {
        console.error("Failed to subscribe:", err);
        return;
      }
      console.log(`Subscribed to analytics channels`);
    }
  );

  subscriber.on("message", (channel, message) => {
    callback(JSON.parse(message));
  });

  return subscriber;
};

module.exports = { publishAnalyticsEvent, subscribeToAnalytics };
