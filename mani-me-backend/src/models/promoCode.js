const mongoose = require('mongoose');

const promoCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    required: true, 
    unique: true,
    uppercase: true,
    trim: true
  },
  type: { 
    type: String, 
    enum: ['percentage', 'fixed'], 
    required: true 
  },
  value: { 
    type: Number, 
    required: true,
    min: 0
  },
  description: { 
    type: String,
    default: ''
  },
  expiryDate: { 
    type: Date, 
    required: true 
  },
  usageLimit: { 
    type: Number, 
    required: true,
    min: 1
  },
  usedCount: { 
    type: Number, 
    default: 0 
  },
  minOrderValue: { 
    type: Number, 
    default: 0 
  },
  maxDiscount: {
    type: Number,
    default: null // null means no cap
  },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'expired'], 
    default: 'active' 
  },
  applicableTo: {
    type: String,
    enum: ['all', 'shipping', 'packaging', 'grocery'],
    default: 'all'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update timestamps on save
promoCodeSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Add indexes for performance (code index already created via unique: true)
promoCodeSchema.index({ status: 1, expiryDate: 1 });
promoCodeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PromoCode', promoCodeSchema);
