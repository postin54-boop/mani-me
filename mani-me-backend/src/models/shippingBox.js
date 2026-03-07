const mongoose = require('mongoose');

/**
 * Shipping Box Schema
 * Box-based pricing for Shop & Ship service
 * Customers pay per box size, not per item - removes friction
 */
const shippingBoxSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Size constraints
  size: {
    type: String,
    required: true,
    enum: ['small', 'medium', 'large', 'extra_large'],
    unique: true
  },
  
  // Weight limits
  max_weight_kg: {
    type: Number,
    required: true
  },
  min_weight_kg: {
    type: Number,
    default: 0
  },
  
  // Dimensions (for reference)
  dimensions: {
    length_cm: { type: Number, required: true },
    width_cm: { type: Number, required: true },
    height_cm: { type: Number, required: true }
  },
  
  // Pricing - flat rate per box
  price_gbp: {
    type: Number,
    required: true
  },
  
  // Visual
  icon: {
    type: String,
    default: 'cube-outline'
  },
  color: {
    type: String,
    default: '#83C5FA'
  },
  
  // Status
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ShippingBox', shippingBoxSchema);
