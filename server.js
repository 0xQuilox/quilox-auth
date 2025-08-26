/**
 * @file server.js
 * @description The main entry point for the application. This file sets up the
 * Express server, configures middleware, and mounts all API routes.
 *
 * This server.js is designed to be lean and modular. It delegates route handling,
 * validation, and authentication to dedicated files, keeping the main file clean
 * and easy to manage.
 */

const express = require('express');
const dotenv = require('dotenv');

// Load environment variables from a .env file.
// This is essential for accessing the JWT_SECRET and other configurations.
dotenv.config();

// =========================================================================
// 1. Import Routes and Middleware
// =========================================================================

// Import the route files that you have created.
// These files contain the route definitions and use our custom middleware.
const userRoutes = require('./src/api/routes/userRoutes');
const postRoutes = require('./src/api/routes/postRoutes');

// Import your custom middlewares.
// Although they are also used within the route files, you can mount them globally here if needed.
const rbacMiddleware = require('./src/middleware/rbacMiddleware');
const validatorMiddleware = require('./src/middleware/validatorMiddleware');

// The `authMiddleware` is a crucial next step, so we'll leave a placeholder here.
// const authMiddleware = require('./src/middleware/authMiddleware');

// =========================================================================
// 2. Server Initialization and Configuration
// =========================================================================

// Create a new Express application instance.
const app = express();
const port = process.env.PORT || 3000;

// =========================================================================
// 3. Global Middleware
// =========================================================================

// Body parser middleware to handle incoming JSON data.
// This must be used before any route that handles JSON payloads.
app.use(express.json());

// =========================================================================
// 4. Route Mounting
// =========================================================================

// A simple root route to verify the server is running.
app.get('/', (req, res) => {
  res.status(200).send('API is running successfully!');
});

// Mount the user routes at the '/api/users' base path.
// All routes defined in userRoutes.js will be prefixed with '/api/users'.
app.use('/api/users', userRoutes);

// Mount the post routes at the '/api/posts' base path.
// All routes defined in postRoutes.js will be prefixed with '/api/posts'.
app.use('/api/posts', postRoutes);

// =========================================================================
// 5. Start the Server
// =========================================================================

// Make the app listen for incoming requests on the specified port.
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log('API documentation:');
  console.log(`- Users API: http://localhost:${port}/api/users`);
  console.log(`- Posts API: http://localhost:${port}/api/posts`);
});