// authMiddleware.js

/**
 * @fileoverview This is an Express middleware for authenticating requests
 * using JSON Web Tokens (JWT). It ensures that a valid token is present
 * in the request header before proceeding to the protected route.
 * * Dependencies:
 * - jsonwebtoken: Used for verifying the JWT.
 * - dotenv: Used to load environment variables, specifically the JWT secret.
 */
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables from a .env file
dotenv.config();

/**
 * Middleware function to verify the authentication token.
 * * It performs the following steps:
 * 1. Checks if the 'Authorization' header is present in the request.
 * 2. Extracts the token from the 'Bearer <token>' format.
 * 3. Verifies the token using the secret key from the environment variables.
 * 4. Decodes the token and attaches the user payload to the request object.
 * 5. Calls the next middleware or route handler.
 * * If the token is invalid or missing, it sends an appropriate error response.
 * * @param {object} req - The Express request object.
 * @param {object} res - The Express response object.
 * @param {function} next - The next middleware function.
 */
exports.verifyToken = (req, res, next) => {
    try {
        // Get the Authorization header from the request
        const authHeader = req.headers['authorization'];

        // If no header is present, deny access
        if (!authHeader) {
            return res.status(401).json({
                message: 'Access Denied: No token provided.'
            });
        }

        // The header is typically in the format "Bearer TOKEN"
        const token = authHeader.split(' ')[1];

        // If the token is missing after splitting, deny access
        if (!token) {
            return res.status(401).json({
                message: 'Access Denied: Malformed token.'
            });
        }

        // Verify the token using the secret key
        // The jwt.verify() method throws an error if the token is invalid or expired
        const verified = jwt.verify(token, process.env.TOKEN_SECRET);

        // If verification is successful, attach the decoded user payload to the request
        // This makes the user data available to all subsequent middleware and route handlers
        req.user = verified;

        // Call the next middleware or route handler in the chain
        next();

    } catch (error) {
        // Handle various errors from jwt.verify()
        console.error('Token verification error:', error.name);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                message: 'Invalid Token: Token has expired.'
            });
        } else if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                message: 'Invalid Token: Signature is not valid.'
            });
        } else {
            return res.status(500).json({
                message: 'Internal Server Error.'
            });
        }
    }
};
