/**
 * @file userModel.js
 * @description Defines the Mongoose schema for the 'User' model.
 * This file handles the structure of user data stored in the MongoDB database,
 * including password hashing for security before saving the user document.
 */

// -------------------
// 1. MODULE IMPORTS
// -------------------

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // For password hashing

// -------------------
// 2. SCHEMA DEFINITION
// -------------------

const userSchema = new mongoose.Schema({
  // Email field: required, unique, and stored in lowercase for consistency.
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true, // Removes leading/trailing whitespace
    match: [/.+@.+\..+/, 'Please enter a valid email address'] // Basic email regex validation
  },
  // Password field: required and not returned by default in queries.
  // The 'select: false' ensures the password hash is not accidentally exposed.
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
    select: false
  },
  // Role field: controls user permissions for Role-Based Access Control (RBAC).
  role: {
    type: String,
    enum: ['user', 'editor', 'admin', 'viewer'],
    default: 'user'
  },
  // Optional username for compat with userRoutes demo
  username: {
    type: String,
    trim: true,
    minlength: 3,
    maxlength: 30,
    sparse: true,
  },
  // Active status: allows for deactivating users without deleting their data.
  isActive: {
    type: Boolean,
    default: true
  },
  // Timestamps for when the user was created and last updated.
  // Mongoose automatically manages these fields.
}, {
  timestamps: true
});

// -------------------
// 3. MIDDLEWARE
// -------------------

/**
 * Mongoose pre-save middleware to hash the user's password before it is saved
 * to the database. This is a critical security step.
 *
 * The `pre('save')` hook runs before a document is saved or updated.
 * The `isModified('password')` check ensures that the password is only hashed
 * if it has been newly created or modified.
 */
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || process.env.SALT_ROUNDS || '10', 10);
    const salt = await bcrypt.genSalt(Number.isFinite(rounds) ? rounds : 10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// -------------------
// 4. CUSTOM INSTANCE METHODS
// -------------------

/**
 * Method to compare an entered password with the hashed password in the database.
 * @param {string} candidatePassword - The plain-text password provided by the user.
 * @returns {Promise<boolean>} - A promise that resolves to true if passwords match, false otherwise.
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  // We need to `select: true` the password field for this operation
  // as it is set to `select: false` in the schema.
  return await bcrypt.compare(candidatePassword, this.password);
};

// -------------------
// 5. MODEL EXPORT
// -------------------

// Create and export the 'User' model based on the defined schema.
// Mongoose automatically creates the 'users' collection in the database.
const User = mongoose.model('User', userSchema);
module.exports = User;
