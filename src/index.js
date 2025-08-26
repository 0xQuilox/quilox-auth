// src/index.js

const authMiddleware = require('./middleware/authMiddleware');
const rbacMiddleware = require('./middleware/rbacMiddleware');
const validatorMiddleware = require('./middleware/validatorMiddleware');
const jwtUtils = require('./utils/jwtUtils');
const passwordUtils = require('./utils/passwordUtils');

module.exports = {
  authMiddleware,
  rbacMiddleware,
  validatorMiddleware,
  jwtUtils,
  passwordUtils,
};