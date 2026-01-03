const express = require('express');
const router = express.Router();

const driverController = require('../controllers/driverController');
const { db } = require('../firebase');
const { shipment: Shipment } = require('../models');

// Get all drivers
router.get('/', driverController.getDrivers);

// Add a new driver
router.post('/', driverController.addDriver);

// Get driver assignments (pickups or deliveries) with pagination
router.get('/:id/assignments', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, page = 1, limit = 20 } = req.query;

    if (!type || !['pickup', 'delivery'].includes(type)) {
      return res.status(400).json({ error: 'type parameter required (pickup or delivery)' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build query based on driver type
    const query = type === 'pickup' 
      ? { pickup_driver_id: id }
      : { delivery_driver_id: id };

    // Fetch shipments assigned to this driver
    const shipments = await Shipment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Map shipments to match mobile app expectations
    const assignments = shipments.map(shipment => ({
      _id: shipment._id,
      id: shipment._id,
      parcel_id_short: shipment.tracking_number?.substring(0, 8) || 'N/A',
      tracking_number: shipment.tracking_number,
      sender_name: shipment.sender_name,
      sender_phone: shipment.sender_phone,
      pickup_address: shipment.pickup_address,
      pickup_city: shipment.pickup_city,
      pickup_postcode: shipment.pickup_postcode,
      pickup_date: shipment.pickup_date,
      pickup_time: shipment.pickup_time,
      receiver_name: shipment.receiver_name,
      receiver_phone: shipment.receiver_phone,
      delivery_address: shipment.delivery_address,
      delivery_city: shipment.delivery_city,
      parcel_type: shipment.parcel_description || 'General',
      parcel_image_url: shipment.parcel_image_url,
      special_instructions: shipment.special_instructions,
      status: shipment.status,
      warehouse_status: shipment.warehouse_status,
      qr_code_url: shipment.qr_code_url,
      weight_kg: shipment.weight_kg,
      dimensions: shipment.dimensions,
    }));

    res.json({
      success: true,
      data: {
        shipments: assignments,
        page: parseInt(page),
        limit: parseInt(limit),
        total: assignments.length
      }
    });

  } catch (error) {
    console.error('Error fetching driver assignments:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update pickup status
router.put('/pickups/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Update status
    shipment.status = status;
    if (status === 'parcel_collected' || status === 'picked_up') {
      shipment.warehouse_status = 'received';
    }
    await shipment.save();

    res.json({
      success: true,
      message: 'Pickup status updated successfully',
      shipment
    });

  } catch (error) {
    console.error('Error updating pickup status:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Update delivery status
router.put('/deliveries/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, proof_of_delivery, recipient_name, notes } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const shipment = await Shipment.findById(id);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Update status
    shipment.status = status;
    
    // Add delivery proof if provided
    if (proof_of_delivery) {
      shipment.proof_of_delivery = proof_of_delivery;
    }
    if (recipient_name) {
      shipment.recipient_signature_name = recipient_name;
    }
    if (notes) {
      shipment.delivery_notes = notes;
    }
    if (status === 'delivered') {
      shipment.delivered_at = new Date();
    }

    await shipment.save();

    res.json({
      success: true,
      message: 'Delivery status updated successfully',
      shipment
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

// Clock in
router.post('/clock-in', async (req, res) => {
  try {
    const { driver_id, clock_in_time } = req.body;

    if (!driver_id || !clock_in_time) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const shiftData = {
      driver_id,
      clock_in_time,
      status: 'active',
      date: new Date(clock_in_time).toDateString(),
    };

    // Add shift to Firestore
    const shiftRef = await db.collection('shifts').add(shiftData);

    res.json({
      message: "Clocked in successfully",
      shift_id: shiftRef.id,
      data: shiftData
    });

  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Clock out
router.post('/clock-out', async (req, res) => {
  try {
    const { driver_id, clock_out_time, hours_worked } = req.body;

    if (!driver_id || !clock_out_time || !hours_worked) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Find active shift for this driver
    const shiftsSnapshot = await db.collection('shifts')
      .where('driver_id', '==', driver_id)
      .where('status', '==', 'active')
      .orderBy('clock_in_time', 'desc')
      .limit(1)
      .get();

    if (shiftsSnapshot.empty) {
      return res.status(404).json({ error: "No active shift found" });
    }

    const shiftDoc = shiftsSnapshot.docs[0];
    await shiftDoc.ref.update({
      clock_out_time,
      hours_worked,
      status: 'completed',
    });

    res.json({
      message: "Clocked out successfully",
      hours_worked
    });

  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get driver shift history
router.get('/shifts/:driver_id', async (req, res) => {
  try {
    const { driver_id } = req.params;
    const { start_date, end_date } = req.query;

    let query = db.collection('shifts').where('driver_id', '==', driver_id);

    if (start_date) {
      query = query.where('clock_in_time', '>=', start_date);
    }
    if (end_date) {
      query = query.where('clock_in_time', '<=', end_date);
    }

    const shiftsSnapshot = await query.orderBy('clock_in_time', 'desc').get();

    const shifts = [];
    shiftsSnapshot.forEach(doc => {
      shifts.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ shifts });

  } catch (error) {
    console.error('Error fetching shifts:', error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
