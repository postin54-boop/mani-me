/**
 * Settings Controller
 * @module controllers/settingsController
 */

const Settings = require('../models/settings');
const logger = require('../utils/logger');

/**
 * Get all settings as a key-value map.
 */
exports.getAll = async (req, res) => {
  try {
    const settings = await Settings.find().select('-updatedBy -__v');
    const settingsObj = {};
    settings.forEach(setting => {
      settingsObj[setting.key] = setting.value;
    });
    res.json(settingsObj);
  } catch (error) {
    logger.error('Error fetching settings', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
};

/**
 * Get a single setting by its key.
 */
exports.getByKey = async (req, res) => {
  try {
    const setting = await Settings.findOne({ key: req.params.key });
    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }
    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    logger.error('Error fetching setting', { error: error.message, key: req.params.key });
    res.status(500).json({ message: 'Failed to fetch setting' });
  }
};

/**
 * Create or update a setting by key (upsert).
 */
exports.upsert = async (req, res) => {
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
    logger.error('Error updating setting', { error: error.message, key: req.params.key });
    res.status(500).json({ message: 'Failed to update setting' });
  }
};

/**
 * Delete a setting by key.
 */
exports.remove = async (req, res) => {
  try {
    const setting = await Settings.findOneAndDelete({ key: req.params.key });

    if (!setting) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    logger.error('Error deleting setting', { error: error.message, key: req.params.key });
    res.status(500).json({ message: 'Failed to delete setting' });
  }
};
