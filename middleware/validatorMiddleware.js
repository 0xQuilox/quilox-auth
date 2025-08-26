/**
 * @file validatorMiddleware.js
 * @description An extensive and well-documented Express.js middleware for data validation.
 * This middleware uses the Joi library to validate request data against predefined schemas.
 *
 * Key features:
 * - Centralized validation logic for `req.body`, `req.params`, and `req.query`.
 * - Clear and detailed error messages from Joi, returned as a 400 Bad Request response.
 * - Reusable `validate` function.
 * - Supports validation of a single schema or an object containing multiple schemas.
 * - Complete, runnable example demonstrating its usage with various routes.
 */

const express = require('express');
const Joi = require('joi');
const app = express();
const port = 3000;

// Middleware to parse JSON body from requests
app.use(express.json());

// =========================================================================
// 1. The Core Validation Middleware Function
// =========================================================================

/**
 * @function validate
 * @param {object} schemas - An object where keys are 'body', 'params', or 'query',
 * and values are Joi schemas to validate against.
 * @returns {function} An Express.js middleware function.
 * @description A higher-order function that takes a validation schema and returns
 * the actual middleware. This allows for flexible and reusable validation.
 */
function validate(schemas) {
  return (req, res, next) => {
    // Determine the type of validation requested (body, params, query).
    // The keys of the 'schemas' object will tell us what to validate.
    const validationTargets = Object.keys(schemas);

    // Array to collect all validation errors
    const errors = [];

    // Iterate over each validation target to check for errors
    validationTargets.forEach(target => {
      const schema = schemas[target];
      const data = req[target]; // Get the data to validate (e.g., req.body)

      // Use Joi's `validate` method to check the data against the schema
      const { error } = schema.validate(data, {
        abortEarly: false, // Return all errors found, not just the first one
        allowUnknown: false, // Do not allow keys that are not defined in the schema
      });

      // If errors are found, add them to our errors array
      if (error) {
        errors.push({
          location: target,
          details: error.details.map(d => d.message),
        });
      }
    });

    // If any errors were collected, respond with a 400 Bad Request and the error details
    if (errors.length > 0) {
      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    // If validation passes, proceed to the next middleware or route handler
    next();
  };
}

// =========================================================================
// 2. Schema Definitions
// =========================================================================
// Centralize your Joi schemas for different routes or data models.
// This improves readability and reusability.

const schemas = {
  // Schema for user creation
  createUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),

  // Schema for updating a user
  updateUser: Joi.object({
    username: Joi.string().alphanum().min(3).max(30),
    email: Joi.string().email(),
    password: Joi.string().min(8),
  }).min(1), // Ensure at least one field is provided for an update

  // Schema for a post creation
  createPost: Joi.object({
    title: Joi.string().min(5).max(100).required(),
    content: Joi.string().min(20).required(),
    authorId: Joi.string().required(),
  }),

  // Schema for URL parameters (e.g., a post ID)
  postIdParam: Joi.object({
    id: Joi.string().uuid().required(), // Assumes a UUID for the post ID
  }),
  
  // Schema for query parameters (e.g., pagination)
  getPostsQuery: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
  }),
};

// =========================================================================
// 3. Example Usage with Express Routes
// =========================================================================

// --- User Routes ---
app.post('/users', validate({ body: schemas.createUser }), (req, res) => {
  // If we get here, the body is valid.
  console.log('Valid user creation request received:', req.body);
  res.status(201).json({ message: 'User data is valid and was processed.' });
});

app.put('/users/:id', validate({
  params: schemas.postIdParam, // Validate the URL parameter
  body: schemas.updateUser     // Validate the request body
}), (req, res) => {
  // If we get here, both params and body are valid.
  console.log(`Valid update request for user ID: ${req.params.id} with data:`, req.body);
  res.status(200).json({ message: `User with ID ${req.params.id} updated successfully.` });
});

// --- Post Routes ---
app.post('/posts', validate({ body: schemas.createPost }), (req, res) => {
  console.log('Valid post creation request received:', req.body);
  res.status(201).json({ message: 'Post data is valid and was processed.' });
});

app.get('/posts/:id', validate({ params: schemas.postIdParam }), (req, res) => {
  console.log(`Valid fetch request for post ID: ${req.params.id}`);
  res.status(200).json({ message: `Post with ID ${req.params.id} fetched successfully.` });
});

app.get('/posts', validate({ query: schemas.getPostsQuery }), (req, res) => {
  console.log('Valid query parameters for posts list:', req.query);
  res.status(200).json({ message: 'Post list retrieved with valid pagination parameters.' });
});

app.get('/', (req, res) => {
  res.status(200).send('Validator Middleware Example is running.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  console.log('--- To test the routes, use a tool like Postman or curl. ---');
  console.log('Example curl commands for successful requests:');
  console.log(`curl -X POST -H "Content-Type: application/json" -d '{"username": "testuser", "email": "test@example.com", "password": "password123"}' http://localhost:${port}/users`);
  console.log(`curl -X PUT -H "Content-Type: application/json" -d '{"username": "newusername"}' http://localhost:${port}/users/e4d3a2b1-c0a9-8765-4321-f0e9d8c7b6a5`);
  console.log('\nExample curl command for a failed request (missing required fields):');
  console.log(`curl -X POST -H "Content-Type: application/json" -d '{"email": "test@example.com"}' http://localhost:${port}/users`);
});
