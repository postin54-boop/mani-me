/**
 * Shipment Controller
 * Handles all shipment-related request/response logic
 * @module controllers/shipmentController
 */

const { shipment: Shipment, user: User, item: Item } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sendShipmentStatusNotification, sendPickupAssignedNotification } = require('../services/notificationService');
const { cache, cacheKeys } = require('../utils/cache');
const { escapeRegex } = require('../utils/sanitize');
const logger = require('../utils/logger');
const {
  generateParcelId,
  generateQRCodeData,
  generateQRCodeImage,
  determineParcelSize,
  getNextSequenceNumber
} = require('../utils/parcelIdGenerator');

// Stripe for payment cancellation
const stripe = process.env.STRIPE_SECRET_KEY ? require('stripe')(process.env.STRIPE_SECRET_KEY) : null;

/**
 * GET /shipments/recent/:userId - Recent shipments for a user
 */
exports.getRecent = async (req, res) => {
  try {
    const shipments = await Shipment.find({
      userId: req.params.userId,
      status: { $ne: 'cancelled' }
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('tracking_number receiver_name status warehouse_status createdAt updatedAt')
      .lean();
    res.json({ shipments });
  } catch (error) {
    logger.error('Error fetching recent shipments', { error: error.message, userId: req.params.userId });
    res.status(500).json({ error: 'Failed to fetch recent shipments', details: error.message });
  }
};

/**
 * PUT /shipments/assign-driver/:id - Assign a driver to a shipment
 */
exports.assignDriver = async (req, res) => {
  try {
    const { driver_id, type } = req.body;
    if (!driver_id || !type || !['pickup', 'delivery'].includes(type)) {
      return res.status(400).json({ error: 'driver_id and type (pickup|delivery) are required' });
    }

    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    const driver = await User.findById(driver_id);
    if (!driver || driver.role !== 'driver' || driver.verification_status !== 'verified') {
      return res.status(404).json({ error: 'Verified driver not found' });
    }

    if (type === 'pickup') {
      shipment.pickup_driver_id = driver_id;
    } else {
      shipment.delivery_driver_id = driver_id;
    }
    await shipment.save();

    if (driver.push_token) {
      try {
        await sendPickupAssignedNotification(driver.push_token, shipment, driver);
      } catch (notifError) {
        logger.error('Failed to send assignment notification', { error: notifError.message, driverId: driver_id });
      }
    }

    res.json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} driver assigned and notified`,
      shipment
    });
  } catch (error) {
    logger.error('Assign driver error', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * POST /shipments/create - Create a new shipment booking
 */
exports.create = async (req, res) => {
  try {
    const {
      user_id, sender_name, sender_phone, sender_email,
      pickup_address, pickup_city, pickup_postcode, pickup_date, pickup_time,
      receiver_name, receiver_phone, receiver_alternate_phone,
      delivery_address, delivery_city, delivery_region,
      weight_kg, dimensions, parcel_description, parcel_value,
      payment_method, special_instructions, parcel_image_url, customer_photo_url, items
    } = req.body;

    // Validate required fields
    const requiredFields = { sender_name, sender_phone, sender_email, pickup_address, pickup_city, pickup_postcode, receiver_name, receiver_phone, delivery_address, delivery_city };
    const missingFields = Object.entries(requiredFields).filter(([, v]) => !v).map(([k]) => k);
    if (missingFields.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    const effectiveWeight = weight_kg || 1;
    const total_cost = 5 + (effectiveWeight * 2);

    const sequenceNumber = await getNextSequenceNumber(Shipment);
    const { parcel_id, parcel_id_short } = generateParcelId(sequenceNumber);
    const parcel_size = determineParcelSize(effectiveWeight, dimensions);
    const ghana_destination = delivery_city || delivery_region;

    function parseDateSafe(val) {
      if (!val) return undefined;
      // Handle UK date format DD/MM/YYYY
      if (typeof val === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(val)) {
        const [day, month, year] = val.split('/').map(Number);
        const d = new Date(year, month - 1, day);
        return isNaN(d.getTime()) ? undefined : d;
      }
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }

    const shipmentData = {
      id: uuidv4(),
      userId: user_id,
      parcel_id, parcel_id_short, parcel_size,
      parcel_image_url, customer_photo_url, ghana_destination,
      warehouse_status: 'not_arrived',
      sender_name, sender_phone, sender_email,
      pickup_address, pickup_city, pickup_postcode,
      pickup_date: parseDateSafe(pickup_date), pickup_time,
      receiver_name, receiver_phone, receiver_alternate_phone,
      delivery_address, delivery_city,
      delivery_region: delivery_region || delivery_city,
      weight_kg: effectiveWeight, dimensions,
      parcel_description, parcel_value,
      payment_method: payment_method || 'cash',
      payment_status: 'pending',
      total_cost,
      status: 'booked',
      special_instructions,
      booked_at: new Date()
    };

    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Generate QR code
    const qrCodeData = generateQRCodeData({ ...shipmentData, tracking_number: shipment.tracking_number });
    const qrCodeUrl = await generateQRCodeImage(qrCodeData);
    shipment.qr_code_data = qrCodeData;
    shipment.qr_code_url = qrCodeUrl;
    await shipment.save();

    // Create items if provided
    let createdItems = [];
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const itemQRCodeData = JSON.stringify({
          shipment_id: shipment._id,
          item_type: item.parcel_type,
          description: item.description,
          declared_weight: item.declaredWeight,
          estimated_price: item.estimatedPrice,
          images: item.images,
          special_instructions: item.specialInstructions,
          tracking_number: shipment.tracking_number
        });
        let itemQRCodeUrl = null;
        if (typeof generateQRCodeImage === 'function') {
          itemQRCodeUrl = await generateQRCodeImage(itemQRCodeData);
        }
        const newItem = new Item({
          shipment_id: shipment._id,
          parcel_type: item.parcelType,
          description: item.description,
          declared_weight: item.declaredWeight,
          estimated_price: item.estimatedPrice,
          images: item.images,
          qr_code_data: itemQRCodeData,
          qr_code_url: itemQRCodeUrl,
          special_instructions: item.specialInstructions
        });
        await newItem.save();
        createdItems.push(newItem);
      }
    }

    return res.json({
      message: 'Shipment booked successfully',
      shipment: { ...shipment.toObject(), qr_code_url: qrCodeUrl, items: createdItems.map(i => i.toObject()) },
      tracking_number: shipment.tracking_number,
      parcel_id: shipment.parcel_id,
      parcel_id_short: shipment.parcel_id_short
    });
  } catch (error) {
    logger.error('Shipment creation failed', { error: error.message });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * GET /shipments/user/:id - Get all shipments for a user (paginated)
 */
exports.getUserShipments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = (page - 1) * limit;

    const query = { userId: req.params.id, hidden_by_user: { $ne: true } };

    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('pickup_driver_id', 'name email phone country verification_status')
        .populate('delivery_driver_id', 'name email phone country verification_status')
        .lean(),
      Shipment.countDocuments(query)
    ]);

    res.json({
      success: true,
      shipments,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    logger.error('Error fetching user shipments', { error: error.message, userId: req.params.id });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * GET /shipments/track/:tracking_number - Track a shipment (cached)
 */
exports.track = async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const cacheKey = cacheKeys.shipmentByTracking(tracking_number);

    let shipment = cache.get(cacheKey);

    if (!shipment) {
      shipment = await Shipment.findOne({ tracking_number })
        .populate('pickup_driver_id', 'name email phone country verification_status')
        .populate('delivery_driver_id', 'name email phone country verification_status')
        .lean();

      if (shipment) cache.set(cacheKey, shipment, 30);
    }

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ shipment });
  } catch (error) {
    logger.error('Error tracking shipment', { error: error.message, tracking_number: req.params.tracking_number });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Helper: Update shipment status and send notification
 */
const updateStatusAndNotify = async (shipmentId, status) => {
  const shipment = await Shipment.findById(shipmentId)
    .populate('userId', 'push_token name email');

  if (!shipment) return null;

  const previousStatus = shipment.status;
  shipment.status = status;

  const timestampField = `${status}_at`;
  if (shipment[timestampField] !== undefined) {
    shipment[timestampField] = new Date();
  }

  await shipment.save();

  // Invalidate cache
  if (shipment.tracking_number) {
    cache.delete(cacheKeys.shipmentByTracking(shipment.tracking_number));
  }

  // Send push notification
  const user = shipment.userId;
  if (user && user.push_token) {
    try {
      await sendShipmentStatusNotification(user.push_token, shipment.tracking_number, status);
    } catch (notifError) {
      logger.error('Failed to send notification', { error: notifError.message, shipmentId });
    }
  }

  return { shipment, previousStatus };
};

/**
 * PUT /shipments/update-status/:id - Update shipment status
 */
exports.updateStatus = async (req, res) => {
  try {
    const result = await updateStatusAndNotify(req.params.id, req.body.status);
    if (!result) return res.status(404).json({ error: 'Shipment not found' });
    res.json({ message: 'Status updated successfully', shipment: result.shipment });
  } catch (error) {
    logger.error('Update status error', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * PUT /shipments/:id/status - Alias for driver app compatibility
 */
exports.updateStatusAlias = async (req, res) => {
  try {
    const result = await updateStatusAndNotify(req.params.id, req.body.status);
    if (!result) return res.status(404).json({ success: false, error: 'Shipment not found' });
    res.json({
      success: true,
      message: 'Status updated successfully',
      data: { shipment: result.shipment, previousStatus: result.previousStatus, newStatus: req.body.status }
    });
  } catch (error) {
    logger.error('Update status error', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ success: false, error: 'Server error', details: error.message });
  }
};

/**
 * GET /shipments/stats/:userId - Shipment statistics
 */
exports.getStats = async (req, res) => {
  try {
    const stats = await Shipment.aggregate([
      { $match: { userId: req.params.userId } },
      {
        $group: {
          _id: null,
          total_parcels: { $sum: 1 },
          delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
          in_transit: {
            $sum: {
              $cond: [{ $in: ['$status', ['picked_up', 'in_transit', 'customs', 'out_for_delivery']] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || { total_parcels: 0, delivered: 0, in_transit: 0 };
    res.json({ total_parcels: result.total_parcels, delivered: result.delivered, in_transit: result.in_transit });
  } catch (error) {
    logger.error('Error fetching shipment stats', { error: error.message, userId: req.params.userId });
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * PUT /shipments/dropoff/:id - Mark shipment for self drop-off
 */
exports.markDropoff = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (!['booked', 'pending_pickup'].includes(shipment.status)) {
      return res.status(400).json({ error: 'Cannot change to drop-off at this stage' });
    }

    shipment.status = 'pending_dropoff';
    shipment.is_self_dropoff = true;
    shipment.admin_notes = `${shipment.admin_notes || ''}\nCustomer opted for self drop-off at warehouse on ${new Date().toISOString()}`;
    await shipment.save();

    res.json({
      message: 'Shipment marked for warehouse drop-off',
      shipment,
      warehouse: {
        name: 'Mani Me Warehouse',
        address: '123 London Road, London, UK',
        postcode: 'E1 4AA',
        hours: 'Mon-Sat, 9AM-6PM',
        phone: '+44 20 1234 5678'
      }
    });
  } catch (error) {
    logger.error('Error marking shipment for drop-off', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * PUT /shipments/cancel/:id - Cancel a shipment
 */
exports.cancel = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (!['booked', 'pending_pickup', 'pending_dropoff', 'pending'].includes(shipment.status)) {
      return res.status(400).json({
        error: 'Cannot cancel shipment at this stage',
        current_status: shipment.status,
        allowed_statuses: ['booked', 'pending_pickup', 'pending_dropoff', 'pending']
      });
    }

    shipment.status = 'cancelled';
    
    // RELEASE PAYMENT HOLD: If there's a pre-authorized payment, cancel it to release funds
    if (shipment.payment_intent_id && shipment.payment_status !== 'paid') {
      try {
        if (stripe) {
          logger.info('Releasing payment hold for cancelled shipment', { 
            shipmentId: req.params.id, 
            paymentIntentId: shipment.payment_intent_id 
          });
          await stripe.paymentIntents.cancel(shipment.payment_intent_id);
          shipment.payment_status = 'cancelled';
          logger.info('Payment hold released', { shipmentId: req.params.id });
        }
      } catch (paymentError) {
        // Log but don't block cancellation
        logger.error('Failed to release payment hold', { 
          error: paymentError.message, 
          shipmentId: req.params.id 
        });
        shipment.payment_notes = `Failed to release payment hold: ${paymentError.message}`;
      }
    }
    
    await shipment.save();

    const { sendPickupCancellationNotifications } = require('../services/notificationService');
    try {
      await sendPickupCancellationNotifications(shipment);
    } catch (notifError) {
      logger.error('Failed to send cancellation notifications', { error: notifError.message, shipmentId: req.params.id });
    }

    res.json({ message: 'Pickup cancelled successfully', shipment });
  } catch (error) {
    logger.error('Error cancelling shipment', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * PUT /shipments/cancel-dropoff/:id - Cancel drop-off and switch to pickup
 */
exports.cancelDropoff = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (shipment.status !== 'pending_dropoff') {
      return res.status(400).json({ error: 'This shipment is not pending drop-off', current_status: shipment.status });
    }

    shipment.status = 'booked';
    shipment.is_self_dropoff = false;
    shipment.admin_notes = `${shipment.admin_notes || ''}\nCustomer cancelled drop-off and switched back to pickup on ${new Date().toISOString()}`;
    await shipment.save();

    try {
      const { sendDropoffCancelledNotifications } = require('../services/notificationService');
      if (sendDropoffCancelledNotifications) {
        await sendDropoffCancelledNotifications(shipment);
      }
    } catch (notifError) {
      logger.error('Failed to send drop-off cancellation notifications', { error: notifError.message, shipmentId: req.params.id });
    }

    res.json({ message: 'Drop-off cancelled. Your parcel will be picked up by a driver.', shipment });
  } catch (error) {
    logger.error('Error cancelling drop-off', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * PUT /shipments/reschedule/:id - Reschedule a pickup
 */
exports.reschedule = async (req, res) => {
  try {
    const { new_pickup_date, reason } = req.body;

    if (!new_pickup_date || !reason) {
      return res.status(400).json({ error: 'New pickup date and reason are required' });
    }

    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    if (!['booked', 'pending_pickup'].includes(shipment.status)) {
      return res.status(400).json({ error: 'Cannot reschedule pickup at this stage' });
    }

    const old_pickup_date = shipment.pickup_date;
    // Parse UK date format DD/MM/YYYY if provided
    let parsedDate = new_pickup_date;
    if (typeof new_pickup_date === 'string' && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(new_pickup_date)) {
      const [day, month, year] = new_pickup_date.split('/').map(Number);
      parsedDate = new Date(year, month - 1, day);
    } else {
      parsedDate = new Date(new_pickup_date);
    }
    shipment.pickup_date = parsedDate;
    shipment.admin_notes = `${shipment.admin_notes || ''}\nRescheduled from ${old_pickup_date} to ${new_pickup_date}. Reason: ${reason}`;
    await shipment.save();

    const { sendPickupRescheduleNotifications } = require('../services/notificationService');
    try {
      await sendPickupRescheduleNotifications(shipment, old_pickup_date, new_pickup_date, reason);
    } catch (notifError) {
      logger.error('Failed to send reschedule notifications', { error: notifError.message, shipmentId: req.params.id });
    }

    res.json({ message: 'Pickup rescheduled successfully', shipment });
  } catch (error) {
    logger.error('Error rescheduling pickup', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * DELETE /shipments/dismiss/:id - Hide a cancelled or delivered order from user's list
 * Does not delete the record — just hides it from the user's view.
 */
exports.dismiss = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id);

    if (!shipment) return res.status(404).json({ error: 'Shipment not found' });

    // Only allow hiding cancelled or delivered shipments
    if (!['cancelled', 'delivered'].includes(shipment.status)) {
      return res.status(400).json({
        error: 'Only cancelled or delivered orders can be removed from your list',
        current_status: shipment.status,
      });
    }

    shipment.hidden_by_user = true;
    await shipment.save();

    res.json({ message: 'Order removed from your list', shipment });
  } catch (error) {
    logger.error('Error dismissing shipment', { error: error.message, shipmentId: req.params.id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * GET /shipments/warehouse/:parcel_id - Get warehouse parcel details
 */
exports.getWarehouseParcel = async (req, res) => {
  try {
    const { parcel_id } = req.params;

    const shipment = await Shipment.findOne({
      $or: [{ parcel_id }, { parcel_id_short: parcel_id }]
    });

    if (!shipment) return res.status(404).json({ error: 'Parcel not found' });

    res.json({
      parcel_id: shipment.parcel_id,
      parcel_id_short: shipment.parcel_id_short,
      qr_code_url: shipment.qr_code_url,
      qr_code_data: JSON.parse(shipment.qr_code_data || '{}'),
      customer: {
        id: shipment.userId,
        name: shipment.sender_name,
        phone: shipment.sender_phone,
        email: shipment.sender_email,
        photo: shipment.customer_photo_url || shipment.User?.profile_photo
      },
      parcel: {
        size: shipment.parcel_size,
        weight_kg: shipment.weight_kg,
        dimensions: shipment.dimensions,
        description: shipment.parcel_description,
        image: shipment.parcel_image_url
      },
      destination: {
        city: shipment.ghana_destination || shipment.delivery_city,
        region: shipment.delivery_region,
        address: shipment.delivery_address,
        receiver_name: shipment.receiver_name,
        receiver_phone: shipment.receiver_phone
      },
      warehouse_status: shipment.warehouse_status,
      tracking_number: shipment.tracking_number,
      status: shipment.status,
      booked_at: shipment.booked_at
    });
  } catch (error) {
    logger.error('Error fetching warehouse parcel', { error: error.message, parcelId: req.params.parcel_id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * PUT /shipments/warehouse/:parcel_id/status - Update warehouse status
 */
exports.updateWarehouseStatus = async (req, res) => {
  try {
    const { parcel_id } = req.params;
    const { warehouse_status } = req.body;

    const validStatuses = ['not_arrived', 'received', 'sorted', 'packed', 'shipped'];
    if (!validStatuses.includes(warehouse_status)) {
      return res.status(400).json({ error: 'Invalid warehouse status' });
    }

    const shipment = await Shipment.findOne({
      $or: [{ parcel_id }, { parcel_id_short: parcel_id }]
    });

    if (!shipment) return res.status(404).json({ error: 'Parcel not found' });

    shipment.warehouse_status = warehouse_status;
    await shipment.save();

    res.json({
      message: 'Warehouse status updated',
      parcel_id: shipment.parcel_id,
      warehouse_status: shipment.warehouse_status
    });
  } catch (error) {
    logger.error('Error updating warehouse status', { error: error.message, parcelId: req.params.parcel_id });
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};
