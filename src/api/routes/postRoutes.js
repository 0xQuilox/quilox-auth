/**
 * @file postRoutes.js
 * @description Defines and exports all post-related API routes for the application.
 * This file demonstrates how to combine validation, authentication, and
 * role-based access control (RBAC) middleware for secure and robust endpoints.
 *
 * It uses a layered approach to route protection:
 * 1. An authentication middleware checks for a valid JWT.
 * 2. The RBAC middleware then checks if the user's role has the required permissions.
 * 3. The validation middleware ensures the request data is correctly formatted.
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();

// =========================================================================
// 1. Import Middleware & Placeholder for Auth
// =========================================================================

// Import the middlewares you've already created.
const validatorMiddleware = require('../middleware/validatorMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

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

const postSchemas = {
  // Schema for creating a new post
  createPost: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    content: Joi.string().min(20).required(),
    // The author ID should come from the authenticated user, not the request body,
    // to prevent spoofing. However, it's included here for validation purposes.
    authorId: Joi.string().guid({ version: 'uuidv4' }).required(),
  }),

  // Schema for fetching or managing a specific post by ID
  postIdParam: Joi.object({
    id: Joi.string().guid({ version: 'uuidv4' }).required(),
  }),

  // Schema for updating a post
  updatePost: Joi.object({
    title: Joi.string().min(5).max(100),
    content: Joi.string().min(20),
  }).min(1), // Ensures at least one field is provided for an update
};

// =========================================================================
// 3. Post Route Definitions
// =========================================================================

/**
 * @route   POST /api/posts
 * @desc    Create a new post
 * @access  Private (Admin or Editor)
 * This route is protected by both authentication and RBAC. A user must be
 * logged in and have the 'create:post' permission.
 */
router.post(
  '/',
  authMiddleware,
  rbacMiddleware(['create:post']),
  validatorMiddleware({ body: postSchemas.createPost }),
  (req, res) => {
    console.log(`User ID ${req.user.id} is creating a new post.`);
    res.status(201).json({
      message: 'Post created successfully.',
      post: { id: 'newly-generated-id', ...req.body }
    });
  }
);

/**
 * @route   GET /api/posts
 * @desc    Get a list of all posts
 * @access  Public
 * This route is public and requires no authentication. However, if you wanted to
 * show different content to different roles, you could add an optional auth check.
 * For this example, we'll keep it simple and open.
 */
router.get(
  '/',
  rbacMiddleware(['read:post']),
  (req, res) => {
    // This permission check allows anyone with 'read:post' to access this, which
    // based on our RBAC config includes admin, editor, and viewer roles.
    console.log('Fetching a list of all posts.');
    res.status(200).json({
      message: 'List of all posts retrieved successfully.',
      posts: [] // Placeholder for post data.
    });
  }
);

/**
 * @route   GET /api/posts/:id
 * @desc    Get a single post by ID
 * @access  Public
 * Like the GET /api/posts route, this is accessible to any role with 'read:post'.
 */
router.get(
  '/:id',
  rbacMiddleware(['read:post']),
  validatorMiddleware({ params: postSchemas.postIdParam }),
  (req, res) => {
    console.log(`Fetching post with ID: ${req.params.id}`);
    res.status(200).json({
      message: `Post with ID ${req.params.id} retrieved successfully.`,
      post: { id: req.params.id }
    });
  }
);

/**
 * @route   PUT /api/posts/:id
 * @desc    Update a post
 * @access  Private (Admin or Editor)
 * This route requires the 'update:post' permission.
 */
router.put(
  '/:id',
  authMiddleware,
  rbacMiddleware(['update:post']),
  validatorMiddleware({
    params: postSchemas.postIdParam,
    body: postSchemas.updatePost
  }),
  (req, res) => {
    console.log(`User ID ${req.user.id} updating post ${req.params.id} with data:`, req.body);
    res.status(200).json({
      message: `Post with ID ${req.params.id} updated successfully.`
    });
  }
);

/**
 * @route   DELETE /api/posts/:id
 * @desc    Delete a post
 * @access  Private (Admin-only)
 * This route requires the 'delete:post' permission, which is typically reserved for administrators.
 */
router.delete(
  '/:id',
  authMiddleware,
  rbacMiddleware(['delete:post']),
  validatorMiddleware({ params: postSchemas.postIdParam }),
  (req, res) => {
    console.log(`User ID ${req.user.id} attempting to delete post ${req.params.id}.`);
    res.status(200).json({
      message: `Post with ID ${req.params.id} deleted successfully.`
    });
  }
);

module.exports = router;
