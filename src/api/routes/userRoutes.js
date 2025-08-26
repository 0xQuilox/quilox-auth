/**
 * @file userRoutes.js
 * @description Defines and exports all user-related API routes for the application.
 * This file demonstrates how to combine validation, authentication, and
 * role-based access control (RBAC) middleware for secure and robust endpoints.
 *
 * It uses a layered approach to route protection:
 * 1. An authentication middleware checks for a valid JWT.
 * 2. The RBAC middleware then checks if the user's role has the required permissions.
 * 3. The validation middleware ensures the request data is correctly formatted.
 */

const express = require('express');
const Joi = require('joi'); // Joi is needed here to define the schemas.
const router = express.Router();

// =========================================================================
// 1. Import Middleware & Placeholder for Auth
// =========================================================================

const validatorMiddleware = require('../../middleware/validatorMiddleware');
const rbacMiddleware = require('../../middleware/rbacMiddleware');

// IMPORTANT: This is a placeholder. You will create this file next.
// It's crucial for your route protection.
const authMiddleware = (req, res, next) => {
  // In a real application, this would verify a JWT and attach user data.
  // For this example, we'll assume it has run successfully.
  if (!req.user) {
    // This is a simplified check. A real auth middleware would handle JWT verification.
    return res.status(401).json({ error: 'Authentication required.' });
  }
  next();
};

// =========================================================================
// 2. Joi Schemas for Validation
// =========================================================================

// These schemas are used by the validatorMiddleware to check data.
// It's good practice to keep them close to the routes that use them,
// or centralize them in a separate schemas directory if they are large.
const userSchemas = {
  // Schema for creating a new user (e.g., during registration)
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    // The role is optional here; it might be set by the server, not the client.
    role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer'),
  }),
  // Schema for fetching or managing a specific user by ID
  userIdParam: Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(), // Assumes UUID for user IDs
  }),
  // Schema for updating a user
  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().min(8),
    role: Joi.string().valid('admin', 'editor', 'viewer'),
  }).min(1), // Ensures at least one field is provided for the update
};

// =========================================================================
// 3. User Route Definitions
// =========================================================================

/**
 * @route   POST /api/users
 * @desc    Create a new user (e.g., user registration)
 * @access  Public
 * This route is public as it's for new user creation. It only requires validation.
 */
router.post(
  '/',
  validatorMiddleware({ body: userSchemas.createUser }),
  (req, res) => {
    // The request body is now guaranteed to be valid.
    // In a real application, you would call your controller/service layer here.
    console.log('Received valid user creation request:', req.body);
    res.status(201).json({
      message: 'User registered successfully.',
      user: {
        id: 'newly-generated-id',
        username: req.body.username,
        email: req.body.email
      }
    });
  }
);

/**
 * @route   GET /api/users
 * @desc    Get a list of all users
 * @access  Private (Admin-only)
 * This route is protected by both authentication and RBAC. A user must be
 * logged in and have the 'read:user' permission to access this.
 */
router.get(
  '/',
  authMiddleware, // Ensures the user is logged in
  rbacMiddleware(['read:user']), // Ensures the user has permission to read user data
  (req, res) => {
    // The user's role and ID are available on req.user from the auth middleware.
    console.log(`User ID ${req.user.id} with role ${req.user.role} is requesting all users.`);
    // You would fetch all users from the database here.
    res.status(200).json({
      message: 'List of all users retrieved successfully.',
      users: [] // Placeholder for user data.
    });
  }
);

/**
 * @route   GET /api/users/:id
 * @desc    Get a single user by ID
 * @access  Private (Admin-only)
 * This route is protected by both authentication and RBAC.
 */
router.get(
  '/:id',
  authMiddleware,
  rbacMiddleware(['read:user']),
  validatorMiddleware({ params: userSchemas.userIdParam }),
  (req, res) => {
    // Both authentication and validation have passed.
    console.log(`User ID ${req.user.id} requesting details for user ${req.params.id}.`);
    // You would fetch the user from the database here.
    res.status(200).json({
      message: `User with ID ${req.params.id} retrieved successfully.`,
      user: { id: req.params.id } // Placeholder for user data
    });
  }
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update a user's details
 * @access  Private (Admin-only)
 * This route requires the 'update:user' permission.
 */
router.put(
  '/:id',
  authMiddleware,
  rbacMiddleware(['update:user']),
  validatorMiddleware({
    params: userSchemas.userIdParam,
    body: userSchemas.updateUser
  }),
  (req, res) => {
    console.log(`User ID ${req.user.id} updating user ${req.params.id} with data:`, req.body);
    // You would update the user in the database here.
    res.status(200).json({
      message: `User with ID ${req.params.id} updated successfully.`
    });
  }
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete a user
 * @access  Private (Admin-only)
 * This route requires the highly privileged 'delete:user' permission.
 */
router.delete(
  '/:id',
  authMiddleware,
  rbacMiddleware(['delete:user']),
  validatorMiddleware({ params: userSchemas.userIdParam }),
  (req, res) => {
    console.log(`User ID ${req.user.id} attempting to delete user ${req.params.id}.`);
    // You would delete the user from the database here.
    res.status(200).json({
      message: `User with ID ${req.params.id} deleted successfully.`
    });
  }
);

module.exports = router;
