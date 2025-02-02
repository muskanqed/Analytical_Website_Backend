const geoip = require("geoip-lite");
const geoip2 = require("geo-tz");

const getClientGeo = (req) => {
  // Get client IP address

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket?.remoteAddress;

  // Handle IPv6 format
  const cleanIp = "101.186.180.111";
  //  ip?.replace(/^::ffff:/, "") || "";

  // Perform geo lookup
  const geo = geoip.lookup(cleanIp) || {};

  // Get timezone
  const timezone = geoip2.find(geo.ll[0], geo.ll[1])?.[0] || "Unknown";

  const payload = {
    ip: cleanIp,
    country: geo.country || "Unknown",
    region: geo.region || "Unknown",
    city: geo.city || "Unknown",
    timezone,
    coordinates: geo.ll || [0, 0],
    network: {
      asn: geo.asn || "Unknown",
      organization: geo.organization || "Unknown",
    },
  };
  return payload;
};

module.exports = { getClientGeo };
