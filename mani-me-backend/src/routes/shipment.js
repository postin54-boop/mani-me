const express = require('express');
const router = express.Router();
const { shipment: Shipment, user: User, item: Item } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sendShipmentStatusNotification } = require('../services/notificationService');
const { sendPickupAssignedNotification } = require('../services/notificationService');
const { cache, cacheKeys } = require('../utils/cache');

// Get recent shipments for a user (last 5, sorted by date)
router.get('/recent/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const shipments = await Shipment.find({ userId: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('tracking_number receiver_name status warehouse_status createdAt updatedAt')
      .lean();
    res.json({ shipments });
  } catch (error) {
    console.error('Error fetching recent shipments:', error);
    res.status(500).json({ error: 'Failed to fetch recent shipments', details: error.message });
  }
});

// Assign a driver to a shipment and notify the driver

// Assign a driver to a shipment (pickup or delivery) and notify the driver
router.put('/assign-driver/:id', async (req, res) => {
  try {
    const { driver_id, type } = req.body;
    if (!driver_id || !type || !['pickup', 'delivery'].includes(type)) {
      return res.status(400).json({ error: 'driver_id and type (pickup|delivery) are required' });
    }

    // Find shipment using Mongoose
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Find driver and ensure verified using Mongoose
    const driver = await User.findById(driver_id);
    if (!driver || driver.role !== 'driver' || driver.verification_status !== 'verified') {
      return res.status(404).json({ error: 'Verified driver not found' });
    }

    // Assign driver to the correct field
    if (type === 'pickup') {
      shipment.pickup_driver_id = driver_id;
    } else if (type === 'delivery') {
      shipment.delivery_driver_id = driver_id;
    }
    await shipment.save();

    // Send push notification to driver if push_token exists
    if (driver.push_token) {
      try {
        await sendPickupAssignedNotification(driver.push_token, shipment, driver);
      } catch (notifError) {
        console.error('Failed to send assignment notification:', notifError);
      }
    }

    res.json({
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} driver assigned and notified`,
      shipment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});
const {
  generateParcelId,
  generateQRCodeData,
  generateQRCodeImage,
  determineParcelSize,
  getNextSequenceNumber
} = require('../utils/parcelIdGenerator');

// Create a new shipment booking
router.post('/create', async (req, res) => {
  try {
    const {
      user_id,
      sender_name,
      sender_phone,
      sender_email,
      pickup_address,
      pickup_city,
      pickup_postcode,
      pickup_date,
      pickup_time,
      receiver_name,
      receiver_phone,
      receiver_alternate_phone,
      delivery_address,
      delivery_city,
      delivery_region,
      weight_kg,
      dimensions,
      parcel_description,
      parcel_value,
      payment_method,
      special_instructions,
      parcel_image_url,
      customer_photo_url,
      items
    } = req.body;

    // Validate required fields (relaxed for box/item based bookings)
    if (!sender_name || !sender_phone || !sender_email || !pickup_address || 
        !pickup_city || !pickup_postcode || !receiver_name || !receiver_phone || 
        !delivery_address || !delivery_city) {
      // Provide detailed error about missing fields
      const missingFields = [];
      if (!sender_name) missingFields.push('sender_name');
      if (!sender_phone) missingFields.push('sender_phone');
      if (!sender_email) missingFields.push('sender_email');
      if (!pickup_address) missingFields.push('pickup_address');
      if (!pickup_city) missingFields.push('pickup_city');
      if (!pickup_postcode) missingFields.push('pickup_postcode');
      if (!receiver_name) missingFields.push('receiver_name');
      if (!receiver_phone) missingFields.push('receiver_phone');
      if (!delivery_address) missingFields.push('delivery_address');
      if (!delivery_city) missingFields.push('delivery_city');
      return res.status(400).json({ error: `Missing required fields: ${missingFields.join(', ')}` });
    }

    // Use provided weight or calculate from items, default to 1kg
    const effectiveWeight = weight_kg || 1;

    // Calculate cost (simple pricing: £5 base + £2 per kg)
    const total_cost = 5 + (effectiveWeight * 2);

    // Layer 1: Generate unique parcel IDs with sequential numbering
    const sequenceNumber = await getNextSequenceNumber(Shipment);
    const { parcel_id, parcel_id_short } = generateParcelId(sequenceNumber);

    // Layer 4: Determine parcel size
    const parcel_size = determineParcelSize(effectiveWeight, dimensions);

    // Extract Ghana destination (delivery_city or delivery_region)
    const ghana_destination = delivery_city || delivery_region;

    // Helper to safely parse dates
    function parseDateSafe(val) {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    }

    // Create shipment with basic data first
    const shipmentData = {
      id: uuidv4(),
      userId: user_id, // Map user_id from request to userId for model
      parcel_id,
      parcel_id_short,
      parcel_size,
      parcel_image_url,
      customer_photo_url,
      ghana_destination,
      warehouse_status: 'not_arrived',
      sender_name,
      sender_phone,
      sender_email,
      pickup_address,
      pickup_city,
      pickup_postcode,
      pickup_date: parseDateSafe(pickup_date),
      pickup_time,
      receiver_name,
      receiver_phone,
      receiver_alternate_phone,
      delivery_address,
      delivery_city,
      delivery_region: delivery_region || delivery_city, // Fallback to city if region not provided
      weight_kg: effectiveWeight,
      dimensions,
      parcel_description,
      parcel_value,
      payment_method: payment_method || 'cash',
      payment_status: payment_method === 'cash' ? 'pending' : 'pending',
      total_cost,
      status: 'booked',
      special_instructions,
      booked_at: new Date()
    };

    // Create shipment using Mongoose
    const shipment = new Shipment(shipmentData);
    await shipment.save();

    // Layer 2: Generate QR code data and image for shipment
    const qrCodeData = generateQRCodeData({
      ...shipmentData,
      tracking_number: shipment.tracking_number
    });
    const qrCodeUrl = await generateQRCodeImage(qrCodeData);
    
    // Update shipment with QR code data using Mongoose
    shipment.qr_code_data = qrCodeData;
    shipment.qr_code_url = qrCodeUrl;
    await shipment.save();

    // Create items if provided
    let createdItems = [];
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        // Generate QR code for item
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
        // You can use generateQRCodeImage if you want QR images for items
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
      message: "Shipment booked successfully",
      shipment: {
        ...shipment.toObject(),
        qr_code_url: qrCodeUrl,
        items: createdItems.map(i => i.toObject())
      },
      tracking_number: shipment.tracking_number,
      parcel_id: shipment.parcel_id,
      parcel_id_short: shipment.parcel_id_short
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all shipments for a specific user

// Get all shipments for a specific user, including driver info
router.get('/user/:id', async (req, res) => {
  try {
    const shipments = await Shipment.find({ userId: req.params.id })
      .sort({ createdAt: -1 })
      .populate('pickup_driver_id', 'name email phone country verification_status')
      .populate('delivery_driver_id', 'name email phone country verification_status')
      .lean();
    res.json({ shipments });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Track a shipment by tracking number

// Track a shipment by tracking number, including driver info (CACHED)
router.get('/track/:tracking_number', async (req, res) => {
  try {
    const { tracking_number } = req.params;
    const cacheKey = cacheKeys.shipmentByTracking(tracking_number);
    
    // Try cache first (30 second TTL for tracking - data can change frequently)
    let shipment = cache.get(cacheKey);
    
    if (!shipment) {
      shipment = await Shipment.findOne({
        tracking_number: tracking_number
      })
        .populate('pickup_driver_id', 'name email phone country verification_status')
        .populate('delivery_driver_id', 'name email phone country verification_status')
        .lean();
      
      if (shipment) {
        cache.set(cacheKey, shipment, 30); // Cache for 30 seconds
      }
    }
      
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }
    res.json({ shipment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Update shipment status
router.put('/update-status/:id', async (req, res) => {
  try {
    const { status } = req.body;
    
    // Use Mongoose findById (not Sequelize findByPk)
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');
    
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Update status and corresponding timestamp
    shipment.status = status;
    
    const timestampField = `${status}_at`;
    if (shipment[timestampField] !== undefined) {
      shipment[timestampField] = new Date();
    }

    await shipment.save();

    // Invalidate cache for this shipment
    if (shipment.tracking_number) {
      cache.delete(cacheKeys.shipmentByTracking(shipment.tracking_number));
    }

    // Send push notification if user has a push token
    const user = shipment.userId; // populated user
    if (user && user.push_token) {
      try {
        await sendShipmentStatusNotification(
          user.push_token,
          shipment.tracking_number,
          status
        );
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    res.json({
      message: "Status updated successfully",
      shipment
    });

  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get shipment statistics for a user
router.get('/stats/:userId', async (req, res) => {
  try {
    const total = await Shipment.countDocuments({ userId: req.params.userId });
    const delivered = await Shipment.countDocuments({ 
      userId: req.params.userId, 
      status: 'delivered' 
    });
    const in_transit = await Shipment.countDocuments({ 
      userId: req.params.userId, 
      status: { $in: ['picked_up', 'in_transit', 'customs', 'out_for_delivery'] } 
    });

    res.json({
      total_parcels: total,
      delivered: delivered,
      in_transit: in_transit
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark shipment for self drop-off at warehouse
router.put('/dropoff/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');
    
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Check if shipment can be changed to drop-off
    if (!['booked', 'pending_pickup'].includes(shipment.status)) {
      return res.status(400).json({ error: "Cannot change to drop-off at this stage" });
    }

    // Update status to indicate self drop-off
    shipment.status = 'pending_dropoff';
    shipment.is_self_dropoff = true;
    shipment.admin_notes = `${shipment.admin_notes || ''}\nCustomer opted for self drop-off at warehouse on ${new Date().toISOString()}`;
    await shipment.save();

    res.json({
      message: "Shipment marked for warehouse drop-off",
      shipment,
      warehouse: {
        name: "Mani Me Warehouse",
        address: "123 London Road, London, UK",
        postcode: "E1 4AA",
        hours: "Mon-Sat, 9AM-6PM",
        phone: "+44 20 1234 5678"
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Cancel a pickup
router.put('/cancel/:id', async (req, res) => {
  try {
    // Use Mongoose findById instead of Sequelize findByPk
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');
    
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Check if shipment can be cancelled (not picked up yet)
    // Include pending_dropoff so users who chose drop-off can also cancel
    if (!['booked', 'pending_pickup', 'pending_dropoff', 'pending'].includes(shipment.status)) {
      return res.status(400).json({ 
        error: "Cannot cancel shipment at this stage",
        current_status: shipment.status,
        allowed_statuses: ['booked', 'pending_pickup', 'pending_dropoff', 'pending']
      });
    }

    // Update status to cancelled
    shipment.status = 'cancelled';
    await shipment.save();

    // Import notification functions
    const { sendPickupCancellationNotifications } = require('../services/notificationService');

    // Send notifications to drivers, admin, and customer
    try {
      await sendPickupCancellationNotifications(shipment);
    } catch (notifError) {
      console.error('Failed to send cancellation notifications:', notifError);
    }

    res.json({
      message: "Pickup cancelled successfully",
      shipment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Cancel drop-off and switch back to pickup
router.put('/cancel-dropoff/:id', async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');
    
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Check if shipment is currently pending_dropoff
    if (shipment.status !== 'pending_dropoff') {
      return res.status(400).json({ 
        error: "This shipment is not pending drop-off",
        current_status: shipment.status 
      });
    }

    // Revert status to booked (or pending_pickup if preferred)
    shipment.status = 'booked';
    shipment.is_self_dropoff = false;
    shipment.admin_notes = `${shipment.admin_notes || ''}\nCustomer cancelled drop-off and switched back to pickup on ${new Date().toISOString()}`;
    await shipment.save();

    // Optionally notify drivers/admin about the change
    try {
      const { sendDropoffCancelledNotifications } = require('../services/notificationService');
      if (sendDropoffCancelledNotifications) {
        await sendDropoffCancelledNotifications(shipment);
      }
    } catch (notifError) {
      console.error('Failed to send drop-off cancellation notifications:', notifError);
    }

    res.json({
      message: "Drop-off cancelled. Your parcel will be picked up by a driver.",
      shipment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Reschedule a pickup
router.put('/reschedule/:id', async (req, res) => {
  try {
    const { new_pickup_date, reason } = req.body;

    if (!new_pickup_date || !reason) {
      return res.status(400).json({ error: "New pickup date and reason are required" });
    }

    // Use Mongoose findById instead of Sequelize findByPk
    const shipment = await Shipment.findById(req.params.id)
      .populate('userId', 'push_token name email');
    
    if (!shipment) {
      return res.status(404).json({ error: "Shipment not found" });
    }

    // Check if shipment can be rescheduled
    if (!['booked', 'pending_pickup'].includes(shipment.status)) {
      return res.status(400).json({ error: "Cannot reschedule pickup at this stage" });
    }

    // Store old date for notification
    const old_pickup_date = shipment.pickup_date;

    // Update pickup date
    shipment.pickup_date = new_pickup_date;
    shipment.admin_notes = `${shipment.admin_notes || ''}\nRescheduled from ${old_pickup_date} to ${new_pickup_date}. Reason: ${reason}`;
    await shipment.save();

    // Import notification functions
    const { sendPickupRescheduleNotifications } = require('../services/notificationService');

    // Send notifications to drivers, admin, and customer
    try {
      await sendPickupRescheduleNotifications(shipment, old_pickup_date, new_pickup_date, reason);
    } catch (notifError) {
      console.error('Failed to send reschedule notifications:', notifError);
    }

    res.json({
      message: "Pickup rescheduled successfully",
      shipment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get QR code and parcel details for warehouse sorting
router.get('/warehouse/:parcel_id', async (req, res) => {
  try {
    const { parcel_id } = req.params;
    
    // Find shipment by parcel_id or parcel_id_short
    const shipment = await Shipment.findOne({
      $or: [
        { parcel_id: parcel_id },
        { parcel_id_short: parcel_id }
      ]
    });

    if (!shipment) {
      return res.status(404).json({ error: "Parcel not found" });
    }

    // Return Layer 4 warehouse data
    const warehouseData = {
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
    };

    res.json(warehouseData);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Update warehouse status
router.put('/warehouse/:parcel_id/status', async (req, res) => {
  try {
    const { parcel_id } = req.params;
    const { warehouse_status } = req.body;

    const validStatuses = ['not_arrived', 'received', 'sorted', 'packed', 'shipped'];
    if (!validStatuses.includes(warehouse_status)) {
      return res.status(400).json({ error: "Invalid warehouse status" });
    }

    const shipment = await Shipment.findOne({
      $or: [
        { parcel_id: parcel_id },
        { parcel_id_short: parcel_id }
      ]
    });

    if (!shipment) {
      return res.status(404).json({ error: "Parcel not found" });
    }

    shipment.warehouse_status = warehouse_status;
    await shipment.save();

    res.json({
      message: "Warehouse status updated",
      parcel_id: shipment.parcel_id,
      warehouse_status: shipment.warehouse_status
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
