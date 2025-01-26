const validateTimeRange = (start, end) => {
  if ((start && isNaN(new Date(start))) || (end && isNaN(new Date(end)))) {
    throw new Error("Invalid date format");
  }
};

const validateInterval = (interval) => {
  const validIntervals = ["minute", "hour", "day", "week", "month"];
  if (!validIntervals.includes(interval)) {
    throw new Error(
      `Invalid interval. Valid values: ${validIntervals.join(", ")}`
    );
  }
  return interval;
};
module.exports = { validateTimeRange, validateInterval };
