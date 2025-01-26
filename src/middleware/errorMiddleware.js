const errorHandler = (err, req, res, next) => {
  console.error(`Error: ${err.message}`);

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Something went wrong"
      : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

module.exports = errorHandler;
