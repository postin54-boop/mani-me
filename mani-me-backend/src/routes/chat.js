const express = require('express');
const router = express.Router();
const { db } = require('../firebase');
const Message = require('../models/message');

// Send a message (supports both shipment chat and support chat)
router.post('/send', async (req, res) => {
  try {
    const { shipment_id, sender_id, sender_role, message, sender_name, chat_type } = req.body;

    // Validate required fields
    if (!sender_id || !sender_role || !message) {
      return res.status(400).json({ error: "Missing required fields: sender_id, sender_role, message" });
    }

    // Determine chat type and conversation_id
    const isSupport = chat_type === 'support' || !shipment_id;
    const conversation_id = isSupport ? `support_${sender_id}` : shipment_id;

    const messageData = {
      conversation_id,
      shipment_id: shipment_id || null,
      chat_type: isSupport ? 'support' : 'shipment',
      sender_id,
      sender_role, // 'user', 'driver', or 'admin'
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

// Get support chat messages for a user
router.get('/support/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const conversation_id = `support_${user_id}`;

    const messagesSnapshot = await db.collection('messages')
      .where('conversation_id', '==', conversation_id)
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
    console.error('Error fetching support messages:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all support conversations (for admin)
router.get('/support-conversations', async (req, res) => {
  try {
    // Get distinct support conversations
    const messagesSnapshot = await db.collection('messages')
      .where('chat_type', '==', 'support')
      .orderBy('timestamp', 'desc')
      .limit(100)
      .get();

    // Group by conversation_id to get unique conversations
    const conversationsMap = new Map();
    messagesSnapshot.forEach(doc => {
      const data = doc.data();
      if (!conversationsMap.has(data.conversation_id)) {
        conversationsMap.set(data.conversation_id, {
          conversation_id: data.conversation_id,
          user_id: data.sender_id,
          user_name: data.sender_name,
          last_message: data.message,
          last_timestamp: data.timestamp,
          read: data.read
        });
      }
    });

    res.json({ conversations: Array.from(conversationsMap.values()) });

  } catch (error) {
    console.error('Error fetching support conversations:', error);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
