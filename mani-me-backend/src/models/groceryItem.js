const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Grocery', 'Electronics', 'Household'],
    default: 'Grocery'
  },
  subcategory: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  pack_size: {
    type: String,
    default: '1 item'
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'GBP'
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  image_url: {
    type: String,
    default: null
  },
  fulfilled_by: {
    type: String,
    default: 'ManiMe UK'
  },
  shipping: {
    type: String,
    default: 'UK → Ghana'
  },
  is_available: {
    type: Boolean,
    default: true
  },
  sales: {
    type: Number,
    default: 0
  },
  created_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for faster queries
groceryItemSchema.index({ category: 1, is_available: 1 });
groceryItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('GroceryItem', groceryItemSchema);

