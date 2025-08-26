/**
 * @file server.js
 * @description The main entry point for the Quilox Auth API.
 * This file sets up the Express server, connects to the MongoDB database,
 * and integrates all the necessary middleware and routes for authentication
 * and authorization.
 */

// -------------------
// 1. MODULE IMPORTS
// -------------------

// Core Express framework and utilities
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Security and utility middleware
const helmet = require('helmet'); // Secures HTTP headers
const cors = require('cors'); // Enables Cross-Origin Resource Sharing
const morgan = require('morgan'); // HTTP request logger

// Custom project modules (routes)
const authRoutes = require('./routes/authRoutes');

// -------------------
// 2. CONFIGURATION
// -------------------

// Load environment variables from a .env file
dotenv.config();

// Create the main Express application instance
const app = express();

// -------------------
// 3. MIDDLEWARE SETUP
// -------------------

// Use Helmet for security headers to protect against common attacks
app.use(helmet());

// Use CORS to allow requests from different origins (e.g., a frontend app)
// You can configure this to be more restrictive in a production environment.
app.use(cors());

// Use Morgan for logging HTTP requests.
// 'dev' format provides concise, color-coded output.
app.use(morgan('dev'));

// Middleware to parse incoming JSON requests.
// This makes the request body available on `req.body`.
app.use(express.json());

// -------------------
// 4. DATABASE CONNECTION
// -------------------

const DB_URI = process.env.MONGO_URI;

// Asynchronous function to connect to the database
const connectDB = async () => {
  try {
    // Attempt to connect to MongoDB using the URI from environment variables
    await mongoose.connect(DB_URI);
    console.log('✅ MongoDB successfully connected.');
  } catch (err) {
    // If the connection fails, log the error and exit the process.
    console.error(`❌ MongoDB connection error: ${err.message}`);
    // Exit process with a failure code
    process.exit(1);
  }
};

// Call the function to connect to the database
connectDB();

// -------------------
// 5. ROUTE INTEGRATION
// -------------------

// Mount the authentication routes under the '/api/v1/auth' endpoint.
// This prefixes all routes in authRoutes.js with this path.
app.use('/api/v1/auth', authRoutes);

// A simple root route to confirm the server is running
app.get('/', (req, res) => {
  res.status(200).send('Quilox Auth API is up and running! 🚀');
});

// -------------------
// 6. ERROR HANDLING MIDDLEWARE
// -------------------

// This is a generic error handler that catches any unhandled errors.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// -------------------
// 7. SERVER START
// -------------------

const PORT = process.env.PORT || 5000;

// Start the server and listen for incoming requests on the specified port.
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Press CTRL + C to stop the server.');
});