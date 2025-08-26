/**
 * @file authMiddleware.js
 * @description A detailed Express.js middleware for authenticating requests using JWTs.
 * This middleware is responsible for:
 * - Extracting the token from the Authorization header.
 * - Verifying the token's validity and expiration using jwtUtils.
 * - Attaching the authenticated user's data to the request object (req.user)
 * for downstream middleware and route handlers to use.
 * - Handling various authentication failures (missing token, invalid token, etc.)
 * by sending a 401 Unauthorized response.
 */

const jwt = require('jsonwebtoken');
const jwtUtils = require('../src/utils/jwtUtils');

/**
 * @function authMiddleware
 * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function in the stack.
 * @returns {void}
 * @description Authenticates a user based on the JWT provided in the
 * Authorization header.
 */
function authMiddleware(req, res, next) {
  // Check for the 'Authorization' header.
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    // If no header is present, authentication fails.
    return res.status(401).json({ error: 'Authorization header is missing.' });
  }

  // The header format is typically "Bearer TOKEN".
  const token = authHeader.split(' ')[1];

  // If the token part is missing, the header format is invalid.
  if (!token) {
    return res.status(401).json({ error: 'Authorization token is missing or malformed.' });
  }

  // Use the utility function to verify the token.
  const decodedPayload = jwtUtils.verifyToken(token);

  // If the token is invalid (e.g., expired, bad signature), the function returns null.
  if (!decodedPayload) {
    return res.status(401).json({ error: 'Invalid or expired token. Authentication failed.' });
  }

  // If the token is valid, attach the decoded user data to the request object.
  // This makes the user's information available to all subsequent middleware and routes.
  req.user = decodedPayload;

  // Proceed to the next middleware or the route handler.
  next();
}

module.exports = authMiddleware;
