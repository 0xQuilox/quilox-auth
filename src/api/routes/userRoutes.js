/**
 * @file userRoutes.js
 * @description Example user routes - now uses real authMiddleware (no placeholder).
 * Kept for backwards compat / demo. Prefer /api/v1/auth/* for library usage.
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();

const validatorMiddleware = require('../../middleware/validatorMiddleware');
const rbacMiddleware = require('../../middleware/rbacMiddleware');
const authMiddleware = require('../../middleware/authMiddleware');

const userSchemas = {
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('admin', 'editor', 'viewer', 'user').default('user'),
  }),
  userIdParam: Joi.object({
    id: Joi.string().required(),
  }),
  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().min(8),
    role: Joi.string().valid('admin', 'editor', 'viewer', 'user'),
  }).min(1),
};

router.post('/', validatorMiddleware({ body: userSchemas.createUser }), (req, res) => {
  res.status(201).json({ message: 'User registered successfully.', user: { email: req.body.email } });
});

router.get('/', authMiddleware, rbacMiddleware(['read:user']), (req, res) => {
  res.status(200).json({ message: 'List of all users retrieved successfully.', users: [] });
});

router.get('/:id', authMiddleware, rbacMiddleware(['read:user']), validatorMiddleware({ params: userSchemas.userIdParam }), (req, res) => {
  res.status(200).json({ message: `User with ID ${req.params.id} retrieved successfully.`, user: { id: req.params.id } });
});

router.put('/:id', authMiddleware, rbacMiddleware(['update:user']), validatorMiddleware({ params: userSchemas.userIdParam, body: userSchemas.updateUser }), (req, res) => {
  res.status(200).json({ message: `User with ID ${req.params.id} updated successfully.` });
});

router.delete('/:id', authMiddleware, rbacMiddleware(['delete:user']), validatorMiddleware({ params: userSchemas.userIdParam }), (req, res) => {
  res.status(200).json({ message: `User with ID ${req.params.id} deleted successfully.` });
});

module.exports = router;
