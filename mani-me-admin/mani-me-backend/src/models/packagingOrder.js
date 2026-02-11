const mongoose = require('mongoose');

const packagingOrderSchema = new mongoose.Schema({
  user_id: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  items: [{
    item_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'PackagingItem', 
      required: true 
    },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 1 },
    imageUrl: { type: String }
  }],
  fulfillment_method: { 
    type: String, 
    enum: ['delivery', 'pickup'], 
    required: true 
  },
  delivery_address: {
    street: { type: String },
    city: { type: String },
    postcode: { type: String },
    country: { type: String }
  },
  preferred_date: { type: Date },
  total_amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'ready', 'delivered', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  payment_status: { 
    type: String, 
    enum: ['pending', 'paid', 'refunded'], 
    default: 'pending' 
  },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  fulfilledAt: { type: Date }
});

packagingOrderSchema.pre('save', function() {
  this.updatedAt = Date.now();
});

// Add indexes for performance
packagingOrderSchema.index({ user_id: 1, createdAt: -1 });
packagingOrderSchema.index({ status: 1 });
packagingOrderSchema.index({ payment_status: 1 });
packagingOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('PackagingOrder', packagingOrderSchema);
