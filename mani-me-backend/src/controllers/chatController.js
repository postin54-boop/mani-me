/**
 * Chat Controller
 * @module controllers/chatController
 */

const { db } = require('../firebase');
const Message = require('../models/message');
const logger = require('../utils/logger');

exports.sendMessage = async (req, res) => {
  try {
    const { shipment_id, sender_id, sender_role, message, sender_name, chat_type, conversation_id: providedConversationId } = req.body;
    if (!sender_id || !sender_role || !message) {
      return res.status(400).json({ error: 'Missing required fields: sender_id, sender_role, message' });
    }
    const isSupport = chat_type === 'support' || !shipment_id;
    // Use provided conversation_id (for admin replies) or generate from sender_id
    const conversation_id = providedConversationId || (isSupport ? `support_${sender_id}` : shipment_id);
    const messageData = {
      conversation_id, shipment_id: shipment_id || null,
      chat_type: isSupport ? 'support' : 'shipment',
      sender_id, sender_role, sender_name: sender_name || 'Unknown',
      message, timestamp: new Date().toISOString(), read: false
    };
    const messageRef = await db.collection('messages').add(messageData);
    try {
      await new Message(messageData).save();
    } catch (mongoError) {
      logger.warn('MongoDB message backup failed', { error: mongoError.message });
    }
    res.json({ message: 'Message sent successfully', message_id: messageRef.id, data: messageData });
  } catch (error) {
    logger.error('Error sending message', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getShipmentMessages = async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .where('shipment_id', '==', req.params.shipment_id)
      .orderBy('timestamp', 'asc').get();
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json({ messages });
  } catch (error) {
    logger.error('Error fetching messages', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

// Alias with different response shape for driver app compatibility
exports.getShipmentMessagesCompat = async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .where('shipment_id', '==', req.params.shipment_id)
      .orderBy('timestamp', 'asc').get();
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json({ success: true, data: { messages } });
  } catch (error) {
    logger.error('Error fetching messages', { error: error.message });
    res.status(500).json({ success: false, error: 'Server error' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { user_id } = req.body;
    const snapshot = await db.collection('messages')
      .where('shipment_id', '==', req.params.shipment_id)
      .where('sender_id', '!=', user_id)
      .where('read', '==', false).get();
    const batch = db.batch();
    snapshot.forEach(doc => batch.update(doc.ref, { read: true }));
    await batch.commit();
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    logger.error('Error marking messages read', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .where('sender_id', '!=', req.params.user_id)
      .where('read', '==', false).get();
    res.json({ unread_count: snapshot.size });
  } catch (error) {
    logger.error('Error fetching unread count', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSupportMessages = async (req, res) => {
  try {
    const conversation_id = `support_${req.params.user_id}`;
    const snapshot = await db.collection('messages')
      .where('conversation_id', '==', conversation_id)
      .orderBy('timestamp', 'asc').get();
    const messages = [];
    snapshot.forEach(doc => messages.push({ id: doc.id, ...doc.data() }));
    res.json({ messages });
  } catch (error) {
    logger.error('Error fetching support messages', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSupportConversations = async (req, res) => {
  try {
    const snapshot = await db.collection('messages')
      .where('chat_type', '==', 'support')
      .orderBy('timestamp', 'desc').limit(100).get();
    const conversationsMap = new Map();
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!conversationsMap.has(data.conversation_id)) {
        conversationsMap.set(data.conversation_id, {
          conversation_id: data.conversation_id, user_id: data.sender_id,
          user_name: data.sender_name, last_message: data.message,
          last_timestamp: data.timestamp, read: data.read
        });
      }
    });
    res.json({ conversations: Array.from(conversationsMap.values()) });
  } catch (error) {
    logger.error('Error fetching support conversations', { error: error.message });
    res.status(500).json({ error: 'Server error' });
  }
};
