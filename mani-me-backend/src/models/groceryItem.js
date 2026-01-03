const mongoose = require('mongoose');

const groceryItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['grocery', 'electronics', 'household'],
    default: 'grocery'
  },
  image_url: {
    type: String,
    default: null
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  unit: {
    type: String,
    default: 'item' // e.g., 'kg', 'litre', 'item', 'pack'
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

