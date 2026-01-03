const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const Message = require('../models/message');

// Send a message
router.post('/send', async (req, res) => {
  try {
    const { shipment_id, sender_id, sender_role, message, sender_name } = req.body;

    if (!shipment_id || !sender_id || !sender_role || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const messageData = {
      shipment_id,
      sender_id,
      sender_role, // 'user' or 'driver'
      sender_name: sender_name || 'Unknown',
      message,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add message to Firestore
    const messageRef = await db.collection('messages').add(messageData);

    // Also save to MongoDB as backup
    try {
      const mongoMessage = new Message(messageData);
      await mongoMessage.save();
    } catch (mongoError) {
      console.warn('MongoDB save failed (non-critical):', mongoError.message);
    }

    res.json({
      message: "Message sent successfully",
      message_id: messageRef.id,
      data: messageData
    });

  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

// Get messages for a shipment
router.get('/shipment/:shipment_id', async (req, res) => {
  try {
    const { shipment_id } = req.params;

    const messagesSnapshot = await db.collection('messages')
      .where('shipment_id', '==', shipment_id)
      .orderBy('timestamp', 'asc')
      .get();

    const messages = [];
    messagesSnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({ messages });

  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark messages as read
router.put('/mark-read/:shipment_id', async (req, res) => {
  try {
    const { shipment_id } = req.params;
    const { user_id } = req.body;

    // Update all unread messages for this shipment that were NOT sent by this user
    const messagesSnapshot = await db.collection('messages')
      .where('shipment_id', '==', shipment_id)
      .where('sender_id', '!=', user_id)
      .where('read', '==', false)
      .get();

    const batch = db.batch();
    messagesSnapshot.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });

    await batch.commit();

    res.json({ message: "Messages marked as read" });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get unread message count for a user
router.get('/unread/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    const messagesSnapshot = await db.collection('messages')
      .where('sender_id', '!=', user_id)
      .where('read', '==', false)
      .get();

    res.json({ unread_count: messagesSnapshot.size });

  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
