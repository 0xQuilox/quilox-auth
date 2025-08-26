/**
 * @file authController.js
 * @description This file contains the core business logic for the
 * Quilox Auth API. It handles user registration, login, profile management,
 * and user management tasks for administrators.
 */

// -------------------
// 1. MODULE IMPORTS
// -------------------

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../src/models/userModel'); // Import the Mongoose User model

// -------------------
// 2. HELPER FUNCTIONS
// -------------------

/**
 * Generates a JSON Web Token (JWT) for a user.
 * @param {string} id - The user's database ID.
 * @returns {string} - The signed JWT.
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// ----------------------------------------------------
// 3. AUTHENTICATION & REGISTRATION CONTROLLER FUNCTIONS
// ----------------------------------------------------

/**
 * @desc    Registers a new user in the system.
 * @route   POST /api/v1/auth/register
 * @access  Public
 * @param   {object} req - The request object from Express.
 * @param   {object} res - The response object from Express.
 */
exports.register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create a new user instance
    const newUser = new User({ email, password, role });
    await newUser.save();

    // Generate a JWT for the newly created user
    const token = generateToken(newUser._id);

    // Respond with success message, user data, and the token
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error during user registration:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

/**
 * @desc    Authenticates a user and generates a JWT upon successful login.
 * @route   POST /api/v1/auth/login
 * @access  Public
 * @param   {object} req - The request object.
 * @param   {object} res - The response object.
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email and explicitly select the password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate a JWT for the authenticated user
    const token = generateToken(user._id);

    // Respond with a success message, the token, and user data (without password)
    res.status(200).json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error during user login:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// ---------------------------------------------
// 4. USER PROFILE MANAGEMENT CONTROLLER FUNCTIONS
// ---------------------------------------------

/**
 * @desc    Gets the profile of the authenticated user.
 * @route   GET /api/v1/auth/profile
 * @access  Private
 * @param   {object} req - The request object, containing the user ID from authMiddleware.
 * @param   {object} res - The response object.
 */
exports.getProfile = async (req, res) => {
  try {
    // Get the user ID from the JWT payload added by the authMiddleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile fetched successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Updates the profile of the authenticated user.
 * @route   PATCH /api/v1/auth/profile
 * @access  Private
 * @param   {object} req - The request object.
 * @param   {object} res - The response object.
 */
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { email, role } = req.body; // Role cannot be changed by the user themselves

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { email },
      { new: true, runValidators: true } // Return the updated document and run schema validators
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------------------------------------
// 5. USER MANAGEMENT CONTROLLER FUNCTIONS (ADMIN ONLY)
// ----------------------------------------------------

/**
 * @desc    Gets a list of all users.
 * @route   GET /api/v1/auth/users
 * @access  Private (Admin Only)
 * @param   {object} req - The request object.
 * @param   {object} res - The response object.
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({
      message: 'Users fetched successfully',
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Gets a single user by their ID.
 * @route   GET /api/v1/auth/users/:id
 * @access  Private (Admin Only)
 * @param   {object} req - The request object.
 * @param   {object} res - The response object.
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User fetched successfully',
      user,
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Updates a user's details by their ID.
 * @route   PATCH /api/v1/auth/users/:id
 * @access  Private (Admin Only)
 * @param   {object} req - The request object.
 * @param   {object} res - The response object.
 */
exports.updateUserById = async (req, res) => {
  try {
    const { email, role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { email, role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @desc    Deletes a user by their ID.
 * @route   DELETE /api/v1/auth/users/:id
 * @access  Private (Admin Only)
 * @param   {object} req - The request object.
 * @param   {object} res - The response object.
 */
exports.deleteUserById = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser,
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
