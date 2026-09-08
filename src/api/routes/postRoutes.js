/**
 * @file postRoutes.js
 * @description Example post routes - uses real authMiddleware.
 */

const express = require('express');
const Joi = require('joi');
const router = express.Router();

const validatorMiddleware = require('../../middleware/validatorMiddleware');
const rbacMiddleware = require('../../middleware/rbacMiddleware');
const authMiddleware = require('../../middleware/authMiddleware');

const postSchemas = {
  createPost: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    content: Joi.string().min(20).required(),
  }),
  postIdParam: Joi.object({
    id: Joi.string().required(),
  }),
  updatePost: Joi.object({
    title: Joi.string().min(5).max(100),
    content: Joi.string().min(20),
  }).min(1),
};

router.post('/', authMiddleware, rbacMiddleware(['create:post']), validatorMiddleware({ body: postSchemas.createPost }), (req, res) => {
  res.status(201).json({ message: 'Post created successfully.', post: { id: 'newly-generated-id', ...req.body } });
});

// Public read - no auth required, but strip rbac that required req.user
router.get('/', (req, res) => {
  res.status(200).json({ message: 'List of all posts retrieved successfully.', posts: [] });
});

router.get('/:id', validatorMiddleware({ params: postSchemas.postIdParam }), (req, res) => {
  res.status(200).json({ message: `Post with ID ${req.params.id} retrieved successfully.`, post: { id: req.params.id } });
});

router.put('/:id', authMiddleware, rbacMiddleware(['update:post']), validatorMiddleware({ params: postSchemas.postIdParam, body: postSchemas.updatePost }), (req, res) => {
  res.status(200).json({ message: `Post with ID ${req.params.id} updated successfully.` });
});

router.delete('/:id', authMiddleware, rbacMiddleware(['delete:post']), validatorMiddleware({ params: postSchemas.postIdParam }), (req, res) => {
  res.status(200).json({ message: `Post with ID ${req.params.id} deleted successfully.` });
});

module.exports = router;
