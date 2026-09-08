/**
 * @file server.js
 * @description Production-ready entry: helmet/cors/morgan/rate-limit, healthcheck, graceful DB connect.
 */

const express = require('express');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');

dotenv.config();

const config = require('./src/config');
const authRoutes = require('./src/api/routes/authRoutes');
const userRoutes = require('./src/api/routes/userRoutes');
const postRoutes = require('./src/api/routes/postRoutes');
const { globalLimiter } = require('./src/middleware/rateLimitMiddleware');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');

const app = express();
const port = config.port;

// Global middleware
app.use(helmet());
app.use(cors({ origin: config.cors.origin === '*' ? true : config.cors.origin.split(',').map((s) => s.trim()), credentials: true }));
app.use(morgan(config.env === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Health + root
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running', version: require('./package.json').version });
});
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Routes - v1 canonical, legacy aliases kept
app.use('/api/v1/auth', authRoutes);
app.use('/api/auth', authRoutes); // alias

app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// 404 + error handler (must be last)
app.use(notFound);
app.use(errorHandler);

let server;
async function start() {
  try {
    if (config.mongoUri) {
      await mongoose.connect(config.mongoUri);
      console.log('MongoDB connected');
    } else {
      console.warn('MONGO_URI not set - running without DB (auth routes will fail until DB is configured)');
    }
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    // Don't exit in test env; allow server to start for health checks
    if (config.env === 'production') process.exit(1);
  }

  server = app.listen(port, () => {
    console.log(`Server listening on ${port} [${config.env}]`);
    console.log(`- Health: http://localhost:${port}/health`);
    console.log(`- Auth:   http://localhost:${port}/api/v1/auth`);
  });
}

if (require.main === module) {
  start();
}

// Graceful shutdown
function shutdown(signal) {
  console.log(`Received ${signal}, shutting down...`);
  if (server) server.close(() => console.log('HTTP closed'));
  mongoose.connection.close(false).then(() => console.log('Mongo closed'));
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  shutdown('uncaughtException');
});

module.exports = app;
module.exports.start = start;
