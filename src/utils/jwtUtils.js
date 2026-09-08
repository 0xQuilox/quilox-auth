/**
 * @file jwtUtils.js
 * @description Utility module for JWT generation and verification.
 * - No side-effects on import (no console.log, no demo, no process.exit).
 * - Lazy-validates config so the library can be required without env (e.g. tests).
 * - Supports access + refresh tokens, configurable via env or options.
 */

const jwt = require('jsonwebtoken');

function getSecret(secret) {
  return secret || process.env.JWT_SECRET;
}

function getRefreshSecret(secret) {
  return secret || process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
}

function getExpiresIn(expiresIn) {
  return expiresIn || process.env.JWT_EXPIRES_IN || '1h';
}

function getRefreshExpiresIn(expiresIn) {
  return expiresIn || process.env.JWT_REFRESH_EXPIRES_IN || '7d';
}

function assertSecret(secret, label = 'JWT_SECRET') {
  if (!secret) {
    throw new Error(
      `${label} is not defined. Set process.env.${label} or pass { secret } option.`
    );
  }
}

/**
 * Generate a signed JWT.
 * @param {object} payload
 * @param {object} [options]
 * @param {string} [options.secret]
 * @param {string|number} [options.expiresIn]
 * @returns {string}
 */
function generateToken(payload, options = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Payload must be a non-null object.');
  }
  // allow legacy signature: generateToken(payload, '1h')
  if (typeof options === 'string' || typeof options === 'number') {
    options = { expiresIn: options };
  }
  const secret = getSecret(options.secret);
  assertSecret(secret, 'JWT_SECRET');
  const expiresIn = getExpiresIn(options.expiresIn);
  try {
    return jwt.sign(payload, secret, { expiresIn });
  } catch (err) {
    throw new Error(`Could not generate token: ${err.message}`);
  }
}

/**
 * Generate a refresh token (longer-lived, separate secret if configured).
 */
function generateRefreshToken(payload, options = {}) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-null object.');
  }
  if (typeof options === 'string') options = { expiresIn: options };
  const secret = getRefreshSecret(options.secret);
  assertSecret(secret, 'JWT_REFRESH_SECRET');
  const expiresIn = getRefreshExpiresIn(options.expiresIn);
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verify a JWT. Returns decoded payload or null (never throws for expired/invalid).
 * @param {string} token
 * @param {object} [options]
 * @param {string} [options.secret]
 * @returns {object|null}
 */
function verifyToken(token, options = {}) {
  if (!token || typeof token !== 'string') return null;
  if (typeof options === 'string') options = { secret: options };
  const secret = getSecret(options.secret);
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (_err) {
    return null;
  }
}

function verifyRefreshToken(token, options = {}) {
  if (!token || typeof token !== 'string') return null;
  const secret = getRefreshSecret(options.secret);
  if (!secret) return null;
  try {
    return jwt.verify(token, secret);
  } catch (_err) {
    return null;
  }
}

/**
 * Strict verify that throws on failure. Useful for middleware that wants error details.
 */
function verifyTokenOrThrow(token, options = {}) {
  const secret = getSecret(options.secret);
  assertSecret(secret);
  return jwt.verify(token, secret);
}

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  verifyRefreshToken,
  verifyTokenOrThrow,
  // backwards compat alias
  getSecret,
};
