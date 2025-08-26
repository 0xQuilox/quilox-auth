/**
 * @file passwordUtils.js
 * @description An extensive and well-documented utility module for handling secure password
 * operations using the bcrypt library. This module centralizes password hashing and
 * comparison logic to ensure consistency and strong security practices across your application.
 *
 * It is essential to use a secure, one-way hashing algorithm like bcrypt for passwords.
 * Never store plain-text passwords in your database.
 */

const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables from a .env file.
// This is a crucial step to keep sensitive configuration, like the salt rounds, private.
dotenv.config();

// =========================================================================
// 1. Configuration & Constants
// =========================================================================
// The number of salt rounds to use for bcrypt. A higher number increases the
// computational cost of hashing, making brute-force attacks harder.
// It's recommended to store this in an environment variable for flexibility
// and security. A value of 10-12 is generally a good starting point.
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS, 10) || 10;
if (isNaN(SALT_ROUNDS)) {
  console.error('FATAL ERROR: SALT_ROUNDS must be a number.');
  process.exit(1);
}

// =========================================================================
// 2. Password Hashing
// =========================================================================
/**
 * Hashes a plain-text password using bcrypt.
 * @param {string} password - The plain-text password to hash.
 * @returns {Promise<string>} A promise that resolves to the hashed password.
 * @throws {Error} Throws an error if the password is not a string or hashing fails.
 */
async function hashPassword(password) {
  if (typeof password !== 'string') {
    throw new Error('Password must be a string.');
  }
  try {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashedPassword;
  } catch (err) {
    console.error('Error hashing password:', err);
    throw new Error('Could not hash password.');
  }
}

// =========================================================================
// 3. Password Comparison
// =========================================================================
/**
 * Compares a plain-text password with a hashed password.
 * @param {string} plainPassword - The plain-text password to compare.
 * @param {string} hashedPassword - The hashed password stored in the database.
 * @returns {Promise<boolean>} A promise that resolves to true if the passwords match, false otherwise.
 * @throws {Error} Throws an error if a parameter is missing or comparison fails.
 */
async function comparePassword(plainPassword, hashedPassword) {
  if (typeof plainPassword !== 'string' || typeof hashedPassword !== 'string') {
    throw new Error('Both passwords must be strings for comparison.');
  }
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (err) {
    console.error('Error comparing password:', err);
    throw new Error('Could not compare password.');
  }
}

// =========================================================================
// 4. Example Usage
// =========================================================================
// This self-executing function demonstrates how to use the utility functions.
async function demo() {
  console.log('--- Password Utility Module Demo ---');

  const passwordToHash = 'MySuperSecretPassword123!';
  console.log('\nOriginal Password:', passwordToHash);

  // --- Step 1: Hash the password ---
  try {
    const hashedPassword = await hashPassword(passwordToHash);
    console.log('Hashed Password:', hashedPassword);

    // --- Step 2: Compare a correct password ---
    const correctMatch = await comparePassword(passwordToHash, hashedPassword);
    console.log('\nComparing correct password...');
    console.log(`Password Match? ${correctMatch ? '✅ Yes' : '❌ No'}`);

    // --- Step 3: Compare an incorrect password ---
    const incorrectPassword = 'WrongPassword456!';
    const incorrectMatch = await comparePassword(incorrectPassword, hashedPassword);
    console.log('\nComparing incorrect password...');
    console.log(`Password Match? ${incorrectMatch ? '✅ Yes' : '❌ No'}`);

    console.log('\nDemo complete. This module is ready to be used in your authentication flow.');

  } catch (err) {
    console.error('\nAn error occurred during the demo:', err.message);
  }
}

// Call the demo function to run the example.
// In a real application, you would not have this demo code.
demo();

// =========================================================================
// 5. Export functions for use in other modules
// =========================================================================
module.exports = {
  hashPassword,
  comparePassword,
};
