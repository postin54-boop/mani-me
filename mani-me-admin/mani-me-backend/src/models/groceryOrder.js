const mongoose = require('mongoose');

const groceryOrderSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    item_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GroceryItem',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number,
    category: String
  }],
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  shipping_cost: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  total_amount: {
    type: Number,
    required: true,
    min: 0
  },
  delivery_address: {
    street: String,
    city: String,
    region: String,
    country: {
      type: String,
      enum: ['UK', 'Ghana'],
      required: true
    },
    postcode: String,
    phone: String
  },
  order_status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'delivered', 'cancelled'],
    default: 'pending'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  payment_intent_id: {
    type: String,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  tracking_number: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for faster queries
groceryOrderSchema.index({ user_id: 1, order_status: 1 });
groceryOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('GroceryOrder', groceryOrderSchema);
