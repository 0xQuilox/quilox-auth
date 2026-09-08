/**
 * @file authRoutes.js
 * @description Auth routes - fixed imports, wired rate-limit, correct RBAC names.
 */

const express = require('express');
const authController = require('../../controllers/authController');
const authMiddleware = require('../../middleware/authMiddleware');
const rbacMiddleware = require('../../middleware/rbacMiddleware');
const {
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  validatePasswordChange,
  validate,
} = require('../../middleware/validatorMiddleware');
const { authLimiter } = require('../../middleware/rateLimitMiddleware');

const Joi = require('joi');

const router = express.Router();

// Public - rate limited
router.post('/register', authLimiter, validateUserRegistration, authController.register);
router.post('/login', authLimiter, validateUserLogin, authController.login);
router.post('/refresh', validate({ body: Joi.object({ refreshToken: Joi.string().required() }) }), authController.refresh);

// Protected
router.use(authMiddleware);

router.get('/profile', authController.getProfile);
router.patch('/profile', validateProfileUpdate, authController.updateProfile);
router.patch('/change-password', validatePasswordChange, authController.changePassword);

// Admin-only (RBAC aliases handle 'manage_users' -> manage:all)
router.get('/users', rbacMiddleware(['manage_users']), authController.getAllUsers);
router.get('/users/:id', rbacMiddleware(['manage_users']), authController.getUserById);
router.patch('/users/:id', rbacMiddleware(['manage_users']), authController.updateUserById);
router.delete('/users/:id', rbacMiddleware(['manage_users']), authController.deleteUserById);

module.exports = router;
