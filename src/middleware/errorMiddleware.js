/**
 * @file errorMiddleware.js
 * @description Central error handler + 404.
 */

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const payload = {
    error: err.message || 'Internal Server Error',
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    payload.stack = err.stack;
  }
  // Mongoose validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: 'Validation failed', errors: Object.values(err.errors).map((e) => e.message) });
  }
  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key', field: Object.keys(err.keyValue || {}) });
  }
  return res.status(status).json(payload);
}

function notFound(req, res) {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
}

module.exports = { errorHandler, notFound };
