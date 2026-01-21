const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: String,
    required: true,
    index: true
  },
  shipment_id: {
    type: String,
    required: false, // Optional for support chats
    index: true
  },
  chat_type: {
    type: String,
    enum: ['shipment', 'support'],
    default: 'shipment',
    index: true
  },
  sender_id: {
    type: String, // Changed to String to support both ObjectId and string IDs
    required: true
  },
  sender_role: {
    type: String,
    enum: ['user', 'driver', 'admin'],
    required: true
  },
  sender_name: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  read: {
    type: Boolean,
    default: false
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ conversation_id: 1, timestamp: 1 });
messageSchema.index({ shipment_id: 1, timestamp: 1 });
messageSchema.index({ sender_id: 1, read: 1 });
messageSchema.index({ chat_type: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
