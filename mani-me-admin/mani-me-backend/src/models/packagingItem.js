const mongoose = require('mongoose');

const packagingItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  inStock: { type: Boolean, default: true },
  imageUrl: { type: String, default: 'https://via.placeholder.com/300x300?text=No+Image' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

packagingItemSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('PackagingItem', packagingItemSchema);
