// src/index.js - public library entry
const authMiddleware = require('./middleware/authMiddleware');
const rbacMiddleware = require('./middleware/rbacMiddleware');
const validatorMiddleware = require('./middleware/validatorMiddleware');
const jwtUtils = require('./utils/jwtUtils');
const passwordUtils = require('./utils/passwordUtils');
const config = require('./config');
const User = require('./models/userModel');
const authRoutes = require('./api/routes/authRoutes');
const { globalLimiter, authLimiter } = require('./middleware/rateLimitMiddleware');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

module.exports = {
  // middleware
  authMiddleware,
  rbacMiddleware,
  validatorMiddleware,
  validate: validatorMiddleware,
  globalLimiter,
  authLimiter,
  errorHandler,
  notFound,
  // utils
  jwtUtils,
  passwordUtils,
  // model (optional - consumer may use own model)
  User,
  // routes
  authRoutes,
  // config
  config,
};
