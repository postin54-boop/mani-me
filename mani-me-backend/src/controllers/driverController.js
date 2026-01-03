
const User = require('../models/user');

// Get all drivers (users with a driver role or similar logic)
exports.getDrivers = async (req, res) => {
	try {
		// For demo, return all users (in real app, filter by role: 'driver')
		const drivers = await User.find();
		res.json(drivers);
	} catch (err) {
		res.status(500).json({ message: 'Error fetching drivers' });
	}
};

// Add a new driver
exports.addDriver = async (req, res) => {
	try {
		const { fullName, email, phone, password } = req.body;
		if (!fullName || !email || !password) return res.status(400).json({ message: 'Missing required fields' });
		const exists = await User.findOne({ email });
		if (exists) return res.status(400).json({ message: 'Driver already exists' });
		const driver = new User({ fullName, email, phone, password });
		await driver.save();
		res.status(201).json(driver);
	} catch (err) {
		res.status(500).json({ message: 'Error adding driver' });
	}
};
