/**
 * Driver Controller
 * Handles all driver-related operations
 * @module controllers/driverController
 */

const { db } = require('../firebase');
const { shipment: Shipment } = require('../models');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// Stripe for payment capture
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * GET /drivers - Get all drivers (admin)
 */
exports.getDrivers = async (req, res) => {
	try {
		const page = parseInt(req.query.page) || 1;
		const limit = Math.min(parseInt(req.query.limit) || 50, 100);
		const skip = (page - 1) * limit;
		const [drivers, total] = await Promise.all([
			User.find({ 
				$or: [
					{ role: 'driver' },
					{ role: 'UK_DRIVER' },
					{ role: 'GH_DRIVER' },
					{ role: 'DRIVER' }
				]
			}).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
			User.countDocuments({ $or: [{ role: 'driver' }, { role: 'UK_DRIVER' }, { role: 'GH_DRIVER' }, { role: 'DRIVER' }] })
		]);
		res.json({ drivers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
		const hashedPassword = await bcrypt.hash(password, 10);
		const driver = new User({ fullName, email, phone, password: hashedPassword, role: 'driver' });
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
			
			// CAPTURE PAYMENT: When parcel is collected, charge the customer's card
			if (shipment.payment_method !== 'cash' && stripe) {
				// Capture original payment intent
				if (shipment.payment_intent_id && shipment.payment_status !== 'paid') {
					try {
						logger.info('Capturing payment for pickup', { shipmentId: id, paymentIntentId: shipment.payment_intent_id });
						const paymentIntent = await stripe.paymentIntents.capture(shipment.payment_intent_id);
						shipment.payment_status = 'paid';
						shipment.paid_at = new Date();
						logger.info('Payment captured successfully', { shipmentId: id, amount: paymentIntent.amount });
					} catch (paymentError) {
						logger.error('Failed to capture payment on pickup', { 
							error: paymentError.message, 
							shipmentId: id,
							paymentIntentId: shipment.payment_intent_id
						});
						shipment.payment_notes = `Auto-capture failed: ${paymentError.message}`;
					}
				}

				// Capture size-adjustment extra charge if customer approved one
				const sizeAdj = shipment.size_adjustment;
				if (sizeAdj?.status === 'approved' && sizeAdj?.payment_intent_id) {
					try {
						logger.info('Capturing size-adjustment payment', { shipmentId: id, paymentIntentId: sizeAdj.payment_intent_id });
						const adjPI = await stripe.paymentIntents.capture(sizeAdj.payment_intent_id);
						shipment.size_adjustment.captured = true;
						shipment.size_adjustment.captured_at = new Date();
						logger.info('Size-adjustment payment captured', { shipmentId: id, amount: adjPI.amount });
					} catch (adjError) {
						logger.error('Failed to capture size-adjustment payment', {
							error: adjError.message,
							shipmentId: id,
							paymentIntentId: sizeAdj.payment_intent_id
						});
						shipment.payment_notes = (shipment.payment_notes ? shipment.payment_notes + '; ' : '') +
							`Size-adjustment capture failed: ${adjError.message}`;
					}
				}
			}
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

// ========================================
// PARCEL SIZE PRICING (in pence)
// ========================================
const PARCEL_SIZE_PRICES = {
	small_box: 4500,      // £45
	medium_box: 7500,     // £75
	large_box: 10500,     // £105
	extra_large_box: 14000, // £140
	barrel: 18000,        // £180
};

/**
 * POST /drivers/pickups/:id/size-adjustment - Report size mismatch
 * Driver found parcel is different size than booked
 */
exports.reportSizeMismatch = async (req, res) => {
	try {
		const { id } = req.params;
		const { new_size, driver_notes } = req.body;
		const driverId = req.user?.user_id || req.user?.id || req.user?._id;

		if (!new_size) {
			return res.status(400).json({ error: 'new_size is required' });
		}

		if (!PARCEL_SIZE_PRICES[new_size]) {
			return res.status(400).json({ 
				error: 'Invalid parcel size', 
				valid_sizes: Object.keys(PARCEL_SIZE_PRICES) 
			});
		}

		const shipment = await Shipment.findById(id).populate('userId', 'push_token name email');
		if (!shipment) {
			return res.status(404).json({ error: 'Shipment not found' });
		}

		// Check if already has pending adjustment
		if (shipment.size_adjustment?.requested && shipment.size_adjustment?.status === 'pending') {
			return res.status(400).json({ error: 'Size adjustment already pending for this shipment' });
		}

		const originalSize = shipment.parcel_size || 'small_box';
		const originalCost = PARCEL_SIZE_PRICES[originalSize] || 4500;
		const newCost = PARCEL_SIZE_PRICES[new_size];
		const extraAmount = newCost - originalCost;

		if (extraAmount <= 0) {
			return res.status(400).json({ 
				error: 'New size must be larger than original size',
				original_size: originalSize,
				original_cost: originalCost / 100,
				new_size: new_size,
				new_cost: newCost / 100
			});
		}

		// Update shipment with size adjustment request
		shipment.size_adjustment = {
			requested: true,
			original_size: originalSize,
			new_size: new_size,
			original_cost: originalCost,
			new_cost: newCost,
			extra_amount: extraAmount,
			status: 'pending',
			driver_notes: driver_notes || '',
			requested_at: new Date(),
			requested_by: driverId,
		};

		await shipment.save();

		// Send push notification to customer
		if (shipment.userId?.push_token) {
			try {
				const { sendPushNotification } = require('../services/notificationService');
				await sendPushNotification(
					shipment.userId.push_token,
					'📦 Parcel Size Adjustment Required',
					`Your parcel ${shipment.tracking_number} is actually a ${new_size.replace('_', ' ')}. Please approve the extra £${(extraAmount / 100).toFixed(2)} charge to proceed.`,
					{ 
						type: 'size_adjustment',
						shipmentId: id,
						extraAmount: extraAmount,
						newSize: new_size,
						originalSize: originalSize
					}
				);
			} catch (notifError) {
				logger.error('Failed to send size adjustment notification', { error: notifError.message });
			}
		}

		logger.info('Size mismatch reported', { 
			shipmentId: id, 
			originalSize, 
			newSize: new_size, 
			extraAmount: extraAmount / 100,
			driverId 
		});

		res.json({
			success: true,
			message: 'Size adjustment request sent to customer',
			adjustment: {
				original_size: originalSize,
				new_size: new_size,
				original_cost: `£${(originalCost / 100).toFixed(2)}`,
				new_cost: `£${(newCost / 100).toFixed(2)}`,
				extra_charge: `£${(extraAmount / 100).toFixed(2)}`,
				status: 'pending'
			}
		});
	} catch (error) {
		logger.error('Error reporting size mismatch', { error: error.message, shipmentId: req.params.id });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * GET /drivers/pickups/:id/size-adjustment - Check size adjustment status
 */
exports.getSizeAdjustmentStatus = async (req, res) => {
	try {
		const { id } = req.params;
		
		const shipment = await Shipment.findById(id).select('size_adjustment tracking_number parcel_size');
		if (!shipment) {
			return res.status(404).json({ error: 'Shipment not found' });
		}

		if (!shipment.size_adjustment?.requested) {
			return res.json({ 
				has_adjustment: false,
				message: 'No size adjustment requested for this shipment'
			});
		}

		res.json({
			has_adjustment: true,
			tracking_number: shipment.tracking_number,
			adjustment: {
				original_size: shipment.size_adjustment.original_size,
				new_size: shipment.size_adjustment.new_size,
				extra_amount: `£${(shipment.size_adjustment.extra_amount / 100).toFixed(2)}`,
				status: shipment.size_adjustment.status,
				requested_at: shipment.size_adjustment.requested_at,
				responded_at: shipment.size_adjustment.responded_at,
				driver_notes: shipment.size_adjustment.driver_notes
			}
		});
	} catch (error) {
		logger.error('Error getting size adjustment status', { error: error.message });
		res.status(500).json({ error: 'Server error' });
	}
};

/**
 * POST /drivers/location - Update driver's live location
 */
exports.updateLocation = async (req, res) => {
	try {
		const { latitude, longitude, accuracy, heading, speed } = req.body;

		await User.findByIdAndUpdate(req.userId, {
			last_location: {
				latitude,
				longitude,
				accuracy,
				heading,
				speed,
				updated_at: new Date(),
			}
		});

		res.json({ success: true });
	} catch (error) {
		logger.error('Error updating driver location', { error: error.message });
		res.status(500).json({ error: 'Server error' });
	}
};

/**
 * POST /drivers/documents/:documentType - Upload a driver document
 * Accepts: driving_license, vehicle_insurance, vehicle_registration, profile_photo, dbs_check
 */
exports.uploadDocument = async (req, res) => {
	try {
		const { documentType } = req.params;
		const { url, expiry } = req.body;
		const driverId = req.userId;

		const validDocTypes = ['driving_license', 'vehicle_insurance', 'vehicle_registration', 'profile_photo', 'dbs_check'];
		if (!validDocTypes.includes(documentType)) {
			return res.status(400).json({ error: `Invalid document type. Must be one of: ${validDocTypes.join(', ')}` });
		}

		if (!url) {
			return res.status(400).json({ error: 'Document URL is required' });
		}

		const updateData = {
			[`documents.${documentType}.url`]: url,
			[`documents.${documentType}.status`]: 'pending',
			[`documents.${documentType}.uploaded_at`]: new Date(),
		};

		if (expiry) {
			updateData[`documents.${documentType}.expiry`] = new Date(expiry);
		}

		const user = await User.findByIdAndUpdate(
			driverId,
			{ $set: updateData },
			{ new: true }
		).select('documents');

		if (!user) {
			return res.status(404).json({ error: 'Driver not found' });
		}

		logger.info('Driver document uploaded', { driverId, documentType });

		res.json({
			success: true,
			message: 'Document uploaded successfully. Pending admin review.',
			document: user.documents[documentType],
		});
	} catch (error) {
		logger.error('Error uploading driver document', { error: error.message, driverId: req.userId });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * GET /drivers/documents - Get all documents for current driver
 */
exports.getDocuments = async (req, res) => {
	try {
		const driverId = req.userId;

		const user = await User.findById(driverId).select('documents');
		if (!user) {
			return res.status(404).json({ error: 'Driver not found' });
		}

		res.json({
			success: true,
			documents: user.documents || {},
		});
	} catch (error) {
		logger.error('Error fetching driver documents', { error: error.message, driverId: req.userId });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};

/**
 * PUT /admin/drivers/:driverId/documents/:documentType/status - Admin approve/reject document
 */
exports.updateDocumentStatus = async (req, res) => {
	try {
		const { driverId, documentType } = req.params;
		const { status } = req.body;

		const validStatuses = ['pending', 'approved', 'rejected'];
		if (!validStatuses.includes(status)) {
			return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
		}

		const user = await User.findByIdAndUpdate(
			driverId,
			{ $set: { [`documents.${documentType}.status`]: status } },
			{ new: true }
		).select('documents fullName email');

		if (!user) {
			return res.status(404).json({ error: 'Driver not found' });
		}

		// Check if all required documents are approved
		const requiredDocs = ['driving_license', 'vehicle_insurance', 'vehicle_registration', 'profile_photo'];
		const allApproved = requiredDocs.every(doc => user.documents?.[doc]?.status === 'approved');

		if (allApproved) {
			await User.findByIdAndUpdate(driverId, { is_verified: true });
			logger.info('Driver fully verified', { driverId, email: user.email });
		}

		logger.info('Document status updated', { driverId, documentType, status });

		res.json({
			success: true,
			message: `Document ${status}`,
			document: user.documents[documentType],
			is_verified: allApproved,
		});
	} catch (error) {
		logger.error('Error updating document status', { error: error.message });
		res.status(500).json({ error: 'Server error', details: error.message });
	}
};
