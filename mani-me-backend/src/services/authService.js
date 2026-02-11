/**
 * Auth Service
 * Business logic for authentication operations
 * @module services/authService
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { user: User } = require('../models');
const { validatePassword, validateEmail, sanitizeInput } = require('../utils/validation');
const { sendPasswordResetEmail } = require('../utils/email');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_EXPIRY = '7d';
const SALT_ROUNDS = 10;

/**
 * Format user object for API response (single source of truth)
 */
const formatUser = (user) => ({
  id: user._id,
  name: user.fullName,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  driver_type: user.driver_type,
  country: user.country,
  vehicle_number: user.vehicle_number,
});

/**
 * Generate JWT token for a user
 */
const generateToken = (userId) => {
  return jwt.sign({ user_id: userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
};

/**
 * Get current user from token
 */
const getCurrentUser = async (token) => {
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findById(decoded.user_id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }
  return formatUser(user);
};

/**
 * Register a new user
 */
const register = async ({ fullName, name, email, phone, password, role, driver_type, country }) => {
  if ((!fullName && !name) || !email || !password) {
    const err = new Error('Missing required fields');
    err.statusCode = 400;
    throw err;
  }

  email = sanitizeInput(email);
  fullName = sanitizeInput(fullName || name);

  if (!validateEmail(email)) {
    const err = new Error('Invalid email format');
    err.statusCode = 400;
    throw err;
  }

  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    const err = new Error('Password does not meet requirements');
    err.statusCode = 400;
    err.errors = passwordValidation.errors;
    throw err;
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email already registered');
    err.statusCode = 400;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
  const user = new User({
    fullName,
    email,
    phone,
    password: hashedPassword,
    role: role || 'CUSTOMER',
    driver_type: driver_type || null,
    country: country || null,
  });
  await user.save();

  const token = generateToken(user._id);
  return { user: formatUser(user), token };
};

/**
 * Login a user
 */
const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid email or password');
    err.statusCode = 400;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error('Invalid email or password');
    err.statusCode = 400;
    throw err;
  }

  const token = generateToken(user._id);
  return { user: formatUser(user), token };
};

/**
 * Update user push token
 */
const updatePushToken = async ({ userId, pushToken }) => {
  if (!userId || !pushToken) {
    const err = new Error('Missing userId or pushToken');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  user.push_token = pushToken;
  await user.save();
};

/**
 * Update user profile
 */
const updateProfile = async ({ userId, name, email, phone, address, vehicle_number }) => {
  if (!userId) {
    const err = new Error('Missing userId');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }

  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('Email already in use');
      err.statusCode = 400;
      throw err;
    }
  }

  if (name) user.fullName = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (vehicle_number !== undefined) user.vehicle_number = vehicle_number;

  await user.save();
  return formatUser(user);
};

/**
 * Refresh JWT token (allows expired tokens to be refreshed)
 */
const refreshToken = async (token) => {
  let decoded;
  try {
    decoded = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      decoded = jwt.decode(token);
    } else {
      const error = new Error('Invalid token');
      error.statusCode = 401;
      throw error;
    }
  }

  if (!decoded || !decoded.user_id) {
    const err = new Error('Invalid token payload');
    err.statusCode = 401;
    throw err;
  }

  const user = await User.findById(decoded.user_id);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 401;
    throw err;
  }

  const newToken = generateToken(user._id);
  return { user: formatUser(user), token: newToken };
};

/**
 * Forgot password - generate reset code and send email
 */
const forgotPassword = async (email) => {
  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  email = sanitizeInput(email).toLowerCase();

  const user = await User.findOne({ email });
  if (!user) {
    // Don't reveal whether email exists (security best practice)
    // Still return success to prevent email enumeration
    return { message: 'If an account with that email exists, a reset code has been sent.' };
  }

  // Generate a 6-digit numeric reset code
  const resetCode = crypto.randomInt(100000, 999999).toString();

  // Hash the code before storing (so it's not in plaintext in DB)
  const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

  // Store hashed code and expiry (15 minutes)
  user.resetPasswordToken = hashedCode;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
  await user.save();

  // Send the plain code via email
  await sendPasswordResetEmail(email, resetCode);

  return { message: 'If an account with that email exists, a reset code has been sent.' };
};

/**
 * Reset password using code
 */
const resetPassword = async (email, code, newPassword) => {
  if (!email || !code || !newPassword) {
    const err = new Error('Email, reset code, and new password are required');
    err.statusCode = 400;
    throw err;
  }

  email = sanitizeInput(email).toLowerCase();

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    const err = new Error('Password does not meet requirements');
    err.statusCode = 400;
    err.errors = passwordValidation.errors;
    throw err;
  }

  // Hash the submitted code to compare with stored hash
  const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

  const user = await User.findOne({
    email,
    resetPasswordToken: hashedCode,
    resetPasswordExpires: { $gt: new Date() }, // Not expired
  });

  if (!user) {
    const err = new Error('Invalid or expired reset code');
    err.statusCode = 400;
    throw err;
  }

  // Update password and clear reset fields
  user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return { message: 'Password reset successfully. You can now log in.' };
};

module.exports = {
  getCurrentUser,
  register,
  login,
  updatePushToken,
  updateProfile,
  refreshToken,
  forgotPassword,
  resetPassword,
  formatUser,
  generateToken,
};
