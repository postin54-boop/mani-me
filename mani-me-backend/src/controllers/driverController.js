/**
 * Driver Controller
 * Handles all driver-related operations
 * @module controllers/driverController
 */

const { db } = require('../firebase');
const { shipment: Shipment } = require('../models');
const User = require('../models/user');
const logger = require('../utils/logger');

/**
 * GET /drivers - Get all drivers (admin)
 */
exports.getDrivers = async (req, res) => {
	try {
		const drivers = await User.find({ 
			$or: [
				{ role: 'driver' },
				{ role: 'UK_DRIVER' },
				{ role: 'GH_DRIVER' },
				{ role: 'DRIVER' }
			]
		}).select('-password').lean();
		res.json(drivers);
	} catch (err) {
		logger.error('Error fetching drivers', { error: err.message });
		res.status(500).json({ message: 'Error fetching drivers' });
	}
};

/**
 * POST /drivers - Add a new driver (admin)
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

/**
 * GET /drivers/:id/assignments - Get driver assignments with pagination
 */
exports.getAssignments = async (req, res) => {
	try {
		const { id } = req.params;
		const { type, page = 1, limit = 20 } = req.query;

		if (!type || !['pickup', 'delivery'].includes(type)) {
			return res.status(400).json({ error: 'type parameter required (pickup or delivery)' });
		}

		const skip = (parseInt(page) - 1) * parseInt(limit);
		const query = type === 'pickup'
			? { pickup_driver_id: id }
			: { delivery_driver_id: id };

		const shipments = await Shipment.find(query)
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(parseInt(limit))
			.lean();

		const assignments = shipments.map(s => ({
			_id: s._id,
			id: s._id,
			parcel_id_short: s.parcel_id_short || s.tracking_number?.substring(0, 8) || 'N/A',
			parcel_id: s.parcel_id,
			tracking_number: s.tracking_number,
			sender_name: s.sender_name,
			sender_phone: s.sender_phone,
			sender_email: s.sender_email,
			pickup_address: s.pickup_address,
			pickup_city: s.pickup_city,
			pickup_postcode: s.pickup_postcode,
			pickup_date: s.pickup_date,
			pickup_time: s.pickup_time,
			receiver_name: s.receiver_name,
			receiver_phone: s.receiver_phone,
			receiver_alternate_phone: s.receiver_alternate_phone,
			delivery_address: s.delivery_address,
			delivery_city: s.delivery_city,
			delivery_region: s.delivery_region,
			ghana_destination: s.ghana_destination,
			parcel_type: s.parcel_description || 'General',
			parcel_description: s.parcel_description,
			parcel_size: s.parcel_size,
			parcel_value: s.parcel_value,
			parcel_image_url: s.parcel_image_url,
			weight_kg: s.weight_kg,
			dimensions: s.dimensions,
			special_instructions: s.special_instructions,
			is_self_dropoff: s.is_self_dropoff,
			status: s.status,
			shipment_status: s.shipment_status,
			warehouse_status: s.warehouse_status,
			payment_method: s.payment_method,
			payment_status: s.payment_status,
			total_cost: s.total_cost,
			qr_code_url: s.qr_code_url,
			customer_photo_url: s.customer_photo_url,
			createdAt: s.createdAt,
			booked_at: s.booked_at,
		}));

		res.json({
			success: true,
			data: {
				shipments: assignments,
				page: parseInt(page),
				limit: parseInt(limit),
				total: assignments.length,
			},
		});
	} catch (error) {
		logger.error('Error fetching driver assignments', { error: error.message, driverId: req.params.id });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * PUT /drivers/pickups/:id/status - Update pickup status
 */
exports.updatePickupStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status } = req.body;

		if (!status) return res.status(400).json({ error: 'status is required' });

		const shipment = await Shipment.findById(id);
		if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

		shipment.status = status;
		if (status === 'parcel_collected' || status === 'picked_up') {
			shipment.warehouse_status = 'received';
		}
		await shipment.save();

		res.json({ success: true, message: 'Pickup status updated successfully', shipment });
	} catch (error) {
		logger.error('Error updating pickup status', { error: error.message, shipmentId: req.params.id });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * PUT /drivers/deliveries/:id/status - Update delivery status
 */
exports.updateDeliveryStatus = async (req, res) => {
	try {
		const { id } = req.params;
		const { status, proof_of_delivery, recipient_name, notes } = req.body;

		if (!status) return res.status(400).json({ error: 'status is required' });

		const shipment = await Shipment.findById(id);
		if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

		shipment.status = status;
		if (proof_of_delivery) shipment.proof_of_delivery = proof_of_delivery;
		if (recipient_name) shipment.recipient_signature_name = recipient_name;
		if (notes) shipment.delivery_notes = notes;
		if (status === 'delivered') shipment.delivered_at = new Date();

		await shipment.save();

		res.json({ success: true, message: 'Delivery status updated successfully', shipment });
	} catch (error) {
		logger.error('Error updating delivery status', { error: error.message, shipmentId: req.params.id });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * POST /drivers/clock-in - Clock in a driver
 */
exports.clockIn = async (req, res) => {
	try {
		const { driver_id, clock_in_time } = req.body;

		if (!driver_id || !clock_in_time) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const shiftData = {
			driver_id,
			clock_in_time,
			status: 'active',
			date: new Date(clock_in_time).toDateString(),
		};

		const shiftRef = await db.collection('shifts').add(shiftData);
		res.json({ message: 'Clocked in successfully', shift_id: shiftRef.id, data: shiftData });
	} catch (error) {
		logger.error('Error clocking in', { error: error.message, driverId: req.body.driver_id });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * POST /drivers/clock-out - Clock out a driver
 */
exports.clockOut = async (req, res) => {
	try {
		const { driver_id, clock_out_time, hours_worked } = req.body;

		if (!driver_id || !clock_out_time || !hours_worked) {
			return res.status(400).json({ error: 'Missing required fields' });
		}

		const shiftsSnapshot = await db.collection('shifts')
			.where('driver_id', '==', driver_id)
			.where('status', '==', 'active')
			.orderBy('clock_in_time', 'desc')
			.limit(1)
			.get();

		if (shiftsSnapshot.empty) {
			return res.status(404).json({ error: 'No active shift found' });
		}

		const shiftDoc = shiftsSnapshot.docs[0];
		await shiftDoc.ref.update({ clock_out_time, hours_worked, status: 'completed' });

		res.json({ message: 'Clocked out successfully', hours_worked });
	} catch (error) {
		logger.error('Error clocking out', { error: error.message, driverId: req.body.driver_id });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * GET /drivers/shifts/:driver_id - Get driver shift history
 */
exports.getShiftHistory = async (req, res) => {
	try {
		const { driver_id } = req.params;
		const { start_date, end_date } = req.query;

		let query = db.collection('shifts').where('driver_id', '==', driver_id);
		if (start_date) query = query.where('clock_in_time', '>=', start_date);
		if (end_date) query = query.where('clock_in_time', '<=', end_date);

		const shiftsSnapshot = await query.orderBy('clock_in_time', 'desc').get();
		const shifts = [];
		shiftsSnapshot.forEach(doc => {
			shifts.push({ id: doc.id, ...doc.data() });
		});

		res.json({ shifts });
	} catch (error) {
		logger.error('Error fetching shifts', { error: error.message, driverId: req.params.driver_id });
		res.status(500).json({ error: 'Server error' });
	}
};
