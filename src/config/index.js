/**
 * @file config/index.js
 * @description Centralized, validated config - no process.exit, throws with clear messages.
 */

const dotenv = require('dotenv');
dotenv.config();

function get(key, fallback) {
  const v = process.env[key];
  return v !== undefined && v !== '' ? v : fallback;
}

const config = {
  port: parseInt(get('PORT', '3000'), 10),
  env: get('NODE_ENV', 'development'),
  mongoUri: get('MONGO_URI', ''),
  jwt: {
    secret: get('JWT_SECRET', ''),
    expiresIn: get('JWT_EXPIRES_IN', '1h'),
    refreshSecret: get('JWT_REFRESH_SECRET', get('JWT_SECRET', '')),
    refreshExpiresIn: get('JWT_REFRESH_EXPIRES_IN', '7d'),
  },
  bcrypt: {
    saltRounds: parseInt(get('BCRYPT_SALT_ROUNDS', get('SALT_ROUNDS', '10')), 10),
  },
  rateLimit: {
    windowMs: parseInt(get('RATE_LIMIT_WINDOW_MS', '900000'), 10), // 15min
    max: parseInt(get('RATE_LIMIT_MAX', '100'), 10),
    authWindowMs: parseInt(get('AUTH_RATE_LIMIT_WINDOW_MS', '900000'), 10),
    authMax: parseInt(get('AUTH_RATE_LIMIT_MAX', '10'), 10),
  },
  cors: {
    origin: get('CORS_ORIGIN', '*'),
  },
};

function validate(strict = false) {
  const errors = [];
  if (!config.jwt.secret) errors.push('JWT_SECRET is required');
  if (!Number.isInteger(config.bcrypt.saltRounds) || config.bcrypt.saltRounds < 4) {
    errors.push('BCRYPT_SALT_ROUNDS must be integer >=4');
  }
  if (strict && !config.mongoUri) errors.push('MONGO_URI is required');
  if (errors.length) {
    const err = new Error(`Config validation failed: ${errors.join('; ')}`);
    err.details = errors;
    throw err;
  }
}

module.exports = config;
module.exports.validate = validate;
module.exports.get = get;
