/**
 * @file passwordUtils.js
 * @description Secure password hashing & comparison using bcryptjs (pure JS, no native build).
 * - No side-effects on import.
 * - Validation happens at call-time, not require-time.
 */

const bcrypt = require('bcryptjs');

function getSaltRounds(explicit) {
  if (explicit != null) return explicit;
  const fromEnv = parseInt(process.env.BCRYPT_SALT_ROUNDS || process.env.SALT_ROUNDS || '10', 10);
  return Number.isFinite(fromEnv) ? fromEnv : 10;
}

/**
 * Hash a plain-text password.
 * @param {string} password
 * @param {number} [saltRounds] - overrides env BCRYPT_SALT_ROUNDS
 * @returns {Promise<string>}
 */
async function hashPassword(password, saltRounds) {
  if (typeof password !== 'string' || password.length === 0) {
    throw new Error('Password must be a non-empty string.');
  }
  const rounds = getSaltRounds(saltRounds);
  if (!Number.isInteger(rounds) || rounds < 4 || rounds > 31) {
    throw new Error('saltRounds must be an integer between 4 and 31.');
  }
  try {
    const salt = await bcrypt.genSalt(rounds);
    return await bcrypt.hash(password, salt);
  } catch (err) {
    throw new Error(`Could not hash password: ${err.message}`);
  }
}

/**
 * Compare plain-text vs hashed password.
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
async function comparePassword(plainPassword, hashedPassword) {
  if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
    throw new Error('Both passwords must be strings for comparison.');
  }
  try {
    return await bcrypt.compare(plainPassword, hashedPassword);
  } catch (err) {
    throw new Error(`Could not compare password: ${err.message}`);
  }
}

module.exports = {
  hashPassword,
  comparePassword,
  getSaltRounds,
};
