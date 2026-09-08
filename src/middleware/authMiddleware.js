/**
 * @file authMiddleware.js
 * @description JWT authentication middleware - robust, configurable, no side-effects.
 */

const jwtUtils = require('../utils/jwtUtils');

/**
 * Extract Bearer token case-insensitively.
 */
function extractToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string') return null;
  const trimmed = authHeader.trim();
  // Accept "Bearer <token>" (case-insensitive) or raw token for flexibility
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1] || null;
  }
  if (parts.length === 1) {
    return parts[0] || null;
  }
  return null;
}

/**
 * Create auth middleware with optional config.
 * @param {object} [options]
 * @param {string} [options.secret] - override JWT_SECRET
 * @param {string} [options.header] - header name (default: authorization)
 */
function createAuthMiddleware(options = {}) {
  const secret = options.secret;
  const headerName = (options.header || 'authorization').toLowerCase();

  return function authMiddleware(req, res, next) {
    const authHeader = req.headers[headerName] || req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Authorization header is missing.' });
    }

    const token = extractToken(authHeader);
    if (!token) {
      return res.status(401).json({ error: 'Authorization token is missing or malformed. Use: Bearer <token>' });
    }

    const decoded = jwtUtils.verifyToken(token, secret ? { secret } : {});
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token. Authentication failed.' });
    }

    // Normalize common jwt payload shapes: { id } vs { userId } vs { _id }
    const normalized = { ...decoded };
    if (decoded.id && !decoded.userId) normalized.userId = decoded.id;
    req.user = normalized;
    // Backwards compat: expose `req.user.id` for controllers that read id
    if (!req.user.id && req.user.userId) req.user.id = req.user.userId;
    if (!req.user.id && req.user._id) req.user.id = req.user._id;

    // Block deactivated accounts if payload carries flag (full check in controller/DB layer too)
    if (decoded.isActive === false) {
      return res.status(403).json({ error: 'Account is deactivated.' });
    }

    return next();
  };
}

// Default instance for `require('./authMiddleware')` usage
const authMiddleware = createAuthMiddleware();

authMiddleware.createAuthMiddleware = createAuthMiddleware;
authMiddleware.extractToken = extractToken;

module.exports = authMiddleware;
