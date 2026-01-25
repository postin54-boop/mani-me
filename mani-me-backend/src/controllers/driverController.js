/**
 * Driver Controller
 * Handles driver-related operations
 * @module controllers/driverController
 */

const User = require('../models/user');
const logger = require('../utils/logger');

/**
 * Get all drivers
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getDrivers = async (req, res) => {
	try {
		// Filter by driver roles
		const drivers = await User.find({ 
			$or: [
				{ role: 'driver' },
				{ role: 'UK_DRIVER' },
				{ role: 'GH_DRIVER' },
				{ role: 'DRIVER' }
			]
		}).select('-password');
		res.json(drivers);
	} catch (err) {
		logger.error('Error fetching drivers', { error: err.message });
		res.status(500).json({ message: 'Error fetching drivers' });
	}
};

/**
 * Add a new driver
 * @param {Object} req - Express request object
 * @param {Object} req.body - Driver data
 * @param {string} req.body.fullName - Driver full name
 * @param {string} req.body.email - Driver email
 * @param {string} req.body.phone - Driver phone number
 * @param {string} req.body.password - Driver password
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.addDriver = async (req, res) => {
	try {
		const { fullName, email, phone, password } = req.body;
		if (!fullName || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
		const exists = await User.findOne({ email });
		if (exists) return res.status(400).json({ message: 'Driver already exists' });
		const driver = new User({ fullName, email, phone, password, role: 'driver' });
		await driver.save();
		res.status(201).json(driver);
	} catch (err) {
		logger.error('Error adding driver', { error: err.message, email: req.body.email });
		res.status(500).json({ message: 'Error adding driver' });
	}
};
