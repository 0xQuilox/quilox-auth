/**
 * @file authRoutes.js
 * @description This file defines all the API routes related to authentication and
 * user management for the Quilox Auth API. It organizes routes into public and
 * protected endpoints, applying the necessary middleware for authentication and
 * role-based access control (RBAC).
 */

// -------------------
// 1. MODULE IMPORTS
// -------------------

const express = require('express');

// Import controllers for handling the business logic of each route.
const authController = require('../controllers/authController');

// Import middleware for securing and validating routes.
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');
const {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validatePasswordChange,
} = require('../middleware/validatorMiddleware');

// Create a new router instance from Express.
const router = express.Router();

// ------------------------------------
// 2. PUBLIC ROUTES (NO AUTH REQUIRED)
// ------------------------------------

/**
 * @route   POST /api/v1/auth/register
 * @desc    Registers a new user.
 * @access  Public
 * @details This endpoint validates user input, hashes the password, creates
 * a new user record, and returns a JWT for immediate login.
 */
router.post('/register', validateUserRegistration, authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Authenticates a user and returns a JWT.
 * @access  Public
 * @details This endpoint validates user credentials (email and password),
 * compares the password, and generates a new JWT if successful.
 */
router.post('/login', validateUserLogin, authController.login);

// --------------------------------------------------------
// 3. PROTECTED ROUTES (AUTHENTICATION REQUIRED)
// --------------------------------------------------------

// All routes below this line will use the `authMiddleware` to ensure
// the user is authenticated with a valid JWT.
router.use(authMiddleware);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Gets the authenticated user's profile.
 * @access  Private
 * @details Returns the details of the currently authenticated user based on the
 * JWT in the request header.
 */
router.get('/profile', authController.getProfile);

/**
 * @route   PATCH /api/v1/auth/profile
 * @desc    Updates the authenticated user's profile.
 * @access  Private
 * @details Allows the authenticated user to update their own profile information.
 * Validation middleware is used to ensure data integrity.
 */
router.patch('/profile', validateProfileUpdate, authController.updateProfile);

/**
 * @route   PATCH /api/v1/auth/change-password
 * @desc    Changes the authenticated user's password.
 * @access  Private
 * @details Requires the user to provide their current password and the new password.
 * Validation is performed to ensure the new password meets requirements.
 */
router.patch('/change-password', validatePasswordChange, authController.changePassword);

// -----------------------------------------------------------------
// 4. PROTECTED ROUTES (AUTHENTICATION & RBAC REQUIRED)
// -----------------------------------------------------------------

/**
 * @route   GET /api/v1/auth/users
 * @desc    Gets a list of all users.
 * @access  Private (Admin Only)
 * @details This route is protected by `authMiddleware` and `rbacMiddleware`.
 * Only a user with the 'admin' role, which has the 'manage_users'
 * permission, can access this endpoint.
 */
router.get('/users', rbacMiddleware(['manage_users']), authController.getAllUsers);

/**
 * @route   GET /api/v1/auth/users/:id
 * @desc    Gets a user by ID.
 * @access  Private (Admin Only)
 * @details Requires 'manage_users' permission. Retrieves a single user's
 * details by their database ID.
 */
router.get('/users/:id', rbacMiddleware(['manage_users']), authController.getUserById);

/**
 * @route   PATCH /api/v1/auth/users/:id
 * @desc    Updates a user by ID.
 * @access  Private (Admin Only)
 * @details Requires 'manage_users' permission. Allows an admin to update another
 * user's information, including their role.
 */
router.patch('/users/:id', rbacMiddleware(['manage_users']), authController.updateUserById);

/**
 * @route   DELETE /api/v1/auth/users/:id
 * @desc    Deletes a user by ID.
 * @access  Private (Admin Only)
 * @details Requires 'manage_users' permission. Deletes a user from the database.
 * An admin cannot delete their own account through this endpoint.
 */
router.delete('/users/:id', rbacMiddleware(['manage_users']), authController.deleteUserById);

// -------------------
// 5. EXPORT THE ROUTER
// -------------------

module.exports = router;
