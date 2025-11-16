const express = require('express');
const router = express.Router();
const { Shipment, User } = require('../models');
const { v4: uuidv4 } = require('uuid');
const { sendShipmentStatusNotification } = require('../services/notificationService');

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
      special_instructions
    } = req.body;

    // Validate required fields
    if (!sender_name || !sender_phone || !sender_email || !pickup_address || 
        !pickup_city || !pickup_postcode || !receiver_name || !receiver_phone || 
        !delivery_address || !delivery_city || !delivery_region || !weight_kg) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Calculate cost (simple pricing: £5 base + £2 per kg)
    const total_cost = 5 + (weight_kg * 2);

    const shipment = await Shipment.create({
      id: uuidv4(),
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
      payment_method: payment_method || 'card',
      payment_status: payment_method === 'cash' ? 'pending' : 'pending',
      total_cost,
      status: 'booked',
      special_instructions,
      booked_at: new Date()
    });

    return res.json({
      message: "Shipment booked successfully",
      shipment,
      tracking_number: shipment.tracking_number
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get all shipments for a specific user
router.get('/user/:id', async (req, res) => {
  try {
    const shipments = await Shipment.findAll({
      where: { user_id: req.params.id },
      order: [['created_at', 'DESC']]
    });

    res.json({ shipments });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Track a shipment by tracking number
router.get('/track/:tracking_number', async (req, res) => {
  try {
    const shipment = await Shipment.findOne({
      where: { tracking_number: req.params.tracking_number }
    });

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
    
    const shipment = await Shipment.findByPk(req.params.id, {
      include: [{ model: User, as: 'user' }]
    });
    
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

    // Send push notification if user has a push token
    if (shipment.user && shipment.user.push_token) {
      try {
        await sendShipmentStatusNotification(
          shipment.user.push_token,
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
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get shipment statistics for a user
router.get('/stats/:user_id', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    
    const total = await Shipment.count({ where: { user_id: req.params.user_id } });
    const delivered = await Shipment.count({ 
      where: { user_id: req.params.user_id, status: 'delivered' } 
    });
    const in_transit = await Shipment.count({ 
      where: { 
        user_id: req.params.user_id, 
        status: { [Op.in]: ['picked_up', 'in_transit', 'customs', 'out_for_delivery'] } 
      } 
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

module.exports = router;
