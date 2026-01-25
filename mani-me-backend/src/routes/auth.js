const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { user: User } = require('../models');
const { validatePassword, validateEmail, sanitizeInput } = require('../utils/validation');
const logger = require('../utils/logger');
const { loginLimiter, registerLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');
const validate = require('../middleware/validate');
const { auth: authValidation } = require('../validations');

// TEST ENDPOINT - For connectivity check
router.get('/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is reachable',
    timestamp: new Date().toISOString()
  });
});

// GET CURRENT USER - Validate token and return user data
router.get('/me', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driver_type: user.driver_type,
        country: user.country,
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    logger.error('Auth /me error:', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Server error' });
  }
});

// REGISTER
router.post('/register', registerLimiter, async (req, res) => {
  try {
    let { fullName, name, email, phone, password, role, driver_type, country } = req.body;

    // Basic validation
    if ((!fullName && !name) || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Sanitize inputs
    email = sanitizeInput(email);
    fullName = sanitizeInput(fullName || name);

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        message: "Password does not meet requirements", 
        errors: passwordValidation.errors 
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (Mongoose)
    const user = new User({
      fullName: fullName || name,
      email,
      phone,
      password: hashedPassword,
      role: role || 'CUSTOMER',
      driver_type: driver_type || null,
      country: country || null,
    });
    await user.save();

    // Create token for auto-login after registration
    const token = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({ 
      message: "User registered successfully", 
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driver_type: user.driver_type,
        country: user.country,
      },
      token 
    });
  } catch (error) {
    logger.error('Registration error:', { error: error.message });
    res.status(500).json({ error: "Server error" });
  }
});

// LOGIN
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Create token
    const token = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driver_type: user.driver_type,
        country: user.country,
      }
    });

  } catch (error) {
    logger.error('Login error:', { error: error.message });
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE PUSH TOKEN
router.post('/update-push-token', async (req, res) => {
  try {
    const { userId, pushToken } = req.body;

    if (!userId || !pushToken) {
      return res.status(400).json({ error: "Missing userId or pushToken" });
    }

    // Update user's push token - use Mongoose findById
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.push_token = pushToken;
    await user.save();

    return res.json({ message: "Push token updated successfully" });
  } catch (error) {
    logger.error('Push token update error:', { error: error.message });
    res.status(500).json({ error: "Server error" });
  }
});

// UPDATE PROFILE
router.put('/update-profile', async (req, res) => {
  try {
    const { userId, name, email, phone, address } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "Missing userId" });
    }

    // Find user - use Mongoose findById
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
    }

    // Update user fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address !== undefined) user.address = address;

    await user.save();

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address
      }
    });
  } catch (error) {
    logger.error('Profile update error:', { error: error.message });
    res.status(500).json({ error: "Server error" });
  }
});

// REFRESH TOKEN - Issue new token if current token is valid
router.post('/refresh', async (req, res) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    // Verify current token (even if expired, we can still read the payload)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      // If token is expired but otherwise valid, we can still refresh
      if (err.name === 'TokenExpiredError') {
        decoded = jwt.decode(token);
      } else {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    if (!decoded || !decoded.user_id) {
      return res.status(401).json({ error: 'Invalid token payload' });
    }

    // Find user to ensure they still exist and are active
    const user = await User.findById(decoded.user_id);
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Issue new token
    const newToken = jwt.sign(
      { user_id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      message: "Token refreshed successfully",
      token: newToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        driver_type: user.driver_type,
        country: user.country,
      }
    });
  } catch (error) {
    logger.error('Token refresh error:', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
