function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) return;
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ message });
}

module.exports = errorHandler;
