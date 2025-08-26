/**
 * @file jwtUtils.js
 * @description An extensive and well-documented utility module for handling JSON Web Tokens (JWTs).
 * This module centralizes all JWT-related logic, including token generation and verification,
 * to ensure consistency and security across your application.
 *
 * It uses the popular 'jsonwebtoken' library and handles common use cases and errors.
 */

const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables from a .env file.
// This is a crucial security step to keep your JWT secret key private.
dotenv.config();

// =========================================================================
// 1. Configuration & Constants
// =========================================================================
// The JWT secret key. This must be a long, complex, and random string.
// DO NOT hardcode this value. Use environment variables.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Gracefully handle a missing secret to prevent silent failures.
  console.error('FATAL ERROR: JWT_SECRET is not defined in the environment variables.');
  process.exit(1);
}

// Token expiration time. Shorter expiration times enhance security.
// You can use a library like 'ms' for more human-readable times (e.g., '1h', '30m').
const TOKEN_EXPIRATION = '1h';

// =========================================================================
// 2. Token Generation
// =========================================================================
/**
 * Generates a new JWT.
 * @param {object} payload - The data to encode in the token. Avoid storing sensitive
 * information like passwords. Typically includes user ID, role, etc.
 * @param {string} [expiresIn=TOKEN_EXPIRATION] - The expiration time for the token.
 * @returns {string} The signed JWT.
 * @throws {Error} Throws an error if payload is invalid or signing fails.
 */
function generateToken(payload, expiresIn = TOKEN_EXPIRATION) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a non-null object to generate a token.');
  }
  try {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn });
    return token;
  } catch (err) {
    console.error('Error generating token:', err);
    throw new Error('Could not generate token.');
  }
}

// =========================================================================
// 3. Token Verification
// =========================================================================
/**
 * Verifies a JWT and returns the decoded payload.
 * @param {string} token - The JWT string to verify.
 * @returns {object|null} The decoded payload if the token is valid, otherwise null.
 */
function verifyToken(token) {
  if (!token || typeof token !== 'string') {
    return null;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    // This catch block handles various verification errors like:
    // jwt.TokenExpiredError: if the token has expired.
    // jwt.JsonWebTokenError: if the token is malformed or invalid signature.
    // jwt.NotBeforeError: if the 'nbf' claim is in the future.
    console.error('Token verification failed:', err.message);
    return null;
  }
}

// =========================================================================
// 4. Example Usage
// =========================================================================

// Example payload for a user.
const userPayload = {
  userId: '12345',
  email: 'john.doe@example.com',
  role: 'admin'
};

// Example of how to use the functions.
console.log('--- JWT Utility Module Demo ---');

// --- Step 1: Generate a token ---
try {
  const token = generateToken(userPayload);
  console.log('\nGenerated JWT:');
  console.log(token);

  // --- Step 2: Verify the token ---
  const decodedPayload = verifyToken(token);
  if (decodedPayload) {
    console.log('\nVerified Token Payload:');
    console.log(decodedPayload);
  } else {
    console.log('\nToken verification failed.');
  }

  // --- Step 3: Simulate an expired token for testing ---
  // Create a token that expires in 1 second.
  const expiredToken = generateToken(userPayload, '1s');
  console.log('\nSimulating a token that expires in 1 second...');
  setTimeout(() => {
    const verificationResult = verifyToken(expiredToken);
    if (!verificationResult) {
      console.log('\nSuccessfully handled expired token.');
    }
  }, 1500); // Wait 1.5 seconds to ensure it's expired.

  // --- Step 4: Simulate an invalid token ---
  const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
  console.log('\nVerifying an invalid token...');
  const invalidResult = verifyToken(invalidToken);
  if (!invalidResult) {
    console.log('Successfully handled invalid token.');
  }

} catch (err) {
  console.error('\nAn error occurred during the demo:', err.message);
}

// =========================================================================
// 5. Export functions for use in other modules
// =========================================================================
module.exports = {
  generateToken,
  verifyToken,
};