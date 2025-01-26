const WebSocket = require("ws");
const redis = require("../config/redis");

const setupWebSocket = (server) => {
  const wss = new WebSocket.Server({ server });

  redis.subscribe("pageviews", "events");

  wss.on("connection", (ws) => {
    console.log("New WebSocket client connected");

    redis.on("message", (channel, message) => {
      ws.send(
        JSON.stringify({
          channel,
          data: JSON.parse(message),
        })
      );
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return wss;
};

module.exports = { setupWebSocket };
