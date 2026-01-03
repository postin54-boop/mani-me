const express = require('express');
const router = express.Router();
const Settings = require('../models/settings');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set');
}

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get all settings (public, for mobile app)
router.get('/', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.find().select('-updatedBy -__v');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    res.json(settingsObj);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Get single setting by key
router.get('/:key', verifyToken, async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
});

// Update or create setting (admin only)
router.put('/:key', verifyAdmin, async (req, res) => {
  try {
    const { value, description } = req.body;
    
    if (value === undefined) {
      return res.status(400).json({ message: 'Value is required' });
    }

    const userId = req.user.user_id || req.user.id || req.user._id;

    const setting = await Settings.findOneAndUpdate(
      { key: req.params.key },
      { 
        value, 
        description,
        updatedBy: userId
      },
      { 
        new: true, 
        upsert: true,
        runValidators: true
      }
    );

    res.json({ 
      message: 'Setting updated successfully',
      setting: {
        key: setting.key,
        value: setting.value,
        description: setting.description
      }
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Failed to update setting' });
  }
});

// Delete setting (admin only)
router.delete('/:key', verifyAdmin, async (req, res) => {
  try {
    const setting = await Settings.findOneAndDelete({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ message: 'Failed to delete setting' });
  }
});

module.exports = router;
