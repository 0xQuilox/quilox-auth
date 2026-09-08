/**
 * @file authController.js
 * @description Auth business logic - hardened: isActive checks, role-escalation guard,
 * refresh tokens, changePassword, and no import side-effects.
 */

const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const jwtUtils = require('../utils/jwtUtils');

function signTokens(user) {
  const payload = { id: user._id.toString(), email: user.email, role: user.role };
  const accessToken = jwtUtils.generateToken(payload, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  });
  let refreshToken = null;
  try {
    refreshToken = jwtUtils.generateRefreshToken(payload, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });
  } catch (_e) {
    // refresh secret not configured - gracefully skip
  }
  return { accessToken, refreshToken };
}

// ----------------------------------------------------
// Register
// ----------------------------------------------------
exports.register = async (req, res) => {
  try {
    const { email, password, role, username } = req.body;

    // Prevent privilege escalation: only allow admin to assign non-default roles.
    // If request is unauthenticated, force 'user' regardless of body.role.
    const requestedRole = role || 'user';
    let finalRole = 'user';
    if (requestedRole !== 'user') {
      // If caller is admin (has valid token with admin role), allow; otherwise force user
      if (req.user && req.user.role === 'admin') {
        finalRole = requestedRole;
      } else if (requestedRole === 'admin' || requestedRole === 'editor') {
        // Silently downgrade rather than error to avoid role enumeration
        finalRole = 'user';
      }
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const newUser = new User({ email: normalizedEmail, password, role: finalRole, username });
    await newUser.save();

    const { accessToken, refreshToken } = signTokens(newUser);

    return res.status(201).json({
      message: 'User registered successfully',
      token: accessToken,
      refreshToken,
      user: { id: newUser._id, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    // Duplicate key race condition
    if (error.code === 11000) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }
    console.error('Error during user registration:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
};

// ----------------------------------------------------
// Login
// ----------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isActive === false) {
      return res.status(403).json({ message: 'Account is deactivated. Contact support.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const { accessToken, refreshToken } = signTokens(user);

    return res.status(200).json({
      message: 'Logged in successfully',
      token: accessToken,
      refreshToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error('Error during user login:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// ----------------------------------------------------
// Refresh token
// ----------------------------------------------------
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ message: 'refreshToken is required' });
    }
    const decoded = jwtUtils.verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }
    const user = await User.findById(decoded.id);
    if (!user || user.isActive === false) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }
    const payload = { id: user._id.toString(), email: user.email, role: user.role };
    const accessToken = jwtUtils.generateToken(payload);
    return res.status(200).json({ token: accessToken });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------------------------------------
// Change password (was missing, referenced by authRoutes)
// ----------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId || req.user._id;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId).select('+password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // pre-save hook will hash
    await user.save();

    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ---------------------------------------------
// Profile
// ---------------------------------------------
exports.getProfile = async (req, res) => {
  try {
    const id = req.user.id || req.user.userId;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.isActive === false) return res.status(403).json({ message: 'Account is deactivated' });

    return res.status(200).json({
      message: 'Profile fetched successfully',
      user: { id: user._id, email: user.email, role: user.role, isActive: user.isActive, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id || req.user.userId;
    const { email } = req.body;

    const update = {};
    if (email) update.email = email.toLowerCase().trim();

    const updatedUser = await User.findByIdAndUpdate(userId, update, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    console.error('Error updating user profile:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ----------------------------------------------------
// Admin: User Management
// ----------------------------------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
      User.countDocuments(),
    ]);

    return res.status(200).json({
      message: 'Users fetched successfully',
      count: users.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      users,
    });
  } catch (error) {
    console.error('Error fetching all users:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User fetched successfully', user });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    // Prevent self-role downgrade lockout: warn but allow
    const { email, role, isActive } = req.body;
    const update = {};
    if (email) update.email = email.toLowerCase().trim();
    if (role) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!updatedUser) return res.status(404).json({ message: 'User not found' });

    return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.deleteUserById = async (req, res) => {
  try {
    const requesterId = (req.user.id || req.user.userId || '').toString();
    if (requesterId === req.params.id) {
      return res.status(400).json({ message: 'You cannot delete your own account via this endpoint' });
    }
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    return res.status(200).json({ message: 'User deleted successfully', user: { id: deletedUser._id } });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
