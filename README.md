# Quilox Auth 🔑
A secure and scalable authentication and authorization middleware for Node.js and Express.js applications.

# Overview
Quilox Auth is a robust, production-ready solution for managing user authentication and access control. It provides a complete end-to-end system for user registration, login, and secure session management using JSON Web Tokens (JWTs). Additionally, it includes a flexible Role-Based Access Control (RBAC) middleware to protect your application's routes and resources.

This module is built with security best practices in mind, including password hashing, token expiration, and secure route protection.

# Key Features
✨ JWT-Based Authentication: Implements a stateless authentication system using JSON Web Tokens.

🛡️ Robust Authorization: Uses Role-Based Access Control (RBAC) to manage user permissions.

🔐 Secure Password Handling: Integrates bcrypt.js for secure password hashing and salting.

⚙️ Middleware-Driven: Provides easy-to-use Express.js middleware for authentication and authorization.

📝 Input Validation: Ensures data integrity and security with input validation.

# Prerequisites
To use this module, you should have the following installed:

Node.js (LTS version)

MongoDB

npm

Installation
You can install Quilox Auth in your Node.js project using npm.

npm install quilox-auth

Since this module is a complete solution, you'll also need to install the core dependencies used in the project.

npm install express mongoose bcrypt jsonwebtoken dotenv

# Getting Started
1. Project Structure
This module assumes a standard Node.js and Express.js project structure. Your project should have a structure similar to this:

your-project/
├── controllers/
│   ├── authController.js
├── middleware/
│   ├── authMiddleware.js
│   ├── rbacMiddleware.js
│   ├── validatorMiddleware.js
├── models/
│   ├── userModel.js
├── routes/
│   ├── authRoutes.js
├── .env
└── server.js

2. Configuration (.env)
Create a .env file in the root of your project to store sensitive information.

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_super_secret_refresh_key
JWT_REFRESH_EXPIRES_IN=7d

3. User Model (models/userModel.js)
Define your user schema using Mongoose. The role field is crucial for the RBAC system.

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Prevents the password from being returned by default in queries
  },
  role: {
    type: String,
    enum: ['user', 'editor', 'admin'],
    default: 'user',
  },
});

// Hash the password before saving the user
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;

4. Middleware (middleware/)
middleware/authMiddleware.js
This middleware verifies the JWT from the request header.

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = authMiddleware;

middleware/rbacMiddleware.js
This middleware checks if the user's role has the required permissions.

const roles = {
  admin: ['create', 'read', 'update', 'delete', 'manage_users'],
  editor: ['create', 'read', 'update'],
  user: ['read'],
};

const rbacMiddleware = (requiredPermissions) => (req, res, next) => {
  const userRole = req.user.role;

  if (!userRole || !roles[userRole]) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const hasPermission = requiredPermissions.every((permission) =>
    roles[userRole].includes(permission)
  );

  if (!hasPermission) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  next();
};

module.exports = rbacMiddleware;

5. Routes (routes/authRoutes.js)
Define your API endpoints and protect them with middleware.

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
const rbacMiddleware = require('../middleware/rbacMiddleware');

// Public routes (no authentication required)
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected routes (authentication required)
router.get('/profile', authMiddleware, authController.getProfile);

// Protected route with RBAC
router.delete('/users/:id', authMiddleware, rbacMiddleware(['manage_users']), authController.deleteUser);

module.exports = router;

6. Main Server File (server.js)
Set up your Express server and connect to the database.

const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));

// Use the auth routes
app.use('/api', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

# Usage
Once you have set up your project, you can use a tool like Postman or your frontend application to interact with the API.

Register a User
Method: POST

URL: http://localhost:5000/api/register

Body (JSON):

{
  "email": "testuser@example.com",
  "password": "strongpassword123",
  "role": "editor"
}

(Note: You can omit the role to use the default user role)

Log In
Method: POST

URL: http://localhost:5000/api/login

Body (JSON):

{
  "email": "testuser@example.com",
  "password": "strongpassword123"
}

Response: Will contain a JWT.

Access a Protected Route
Method: GET

URL: http://localhost:5000/api/profile

Headers:

Authorization: Bearer <your_jwt_token>

# Contributing
We welcome contributions! If you would like to contribute, please follow these steps:

Fork the repository.

Create a new branch (git checkout -b feature/your-feature-name).

Make your changes and write clear commit messages.

Push to your fork (git push origin feature/your-feature-name).

Create a pull request with a detailed description of your changes.

# License
This project is licensed under the MIT License. See the LICENSE file for details.