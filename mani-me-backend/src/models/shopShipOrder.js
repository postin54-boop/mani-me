const mongoose = require('mongoose');

/**
 * Shop & Ship Order Schema
 * Orders placed via the Shop & Ship service
 * UK residents shop → Mani Me purchases → consolidates → ships to Ghana
 */
const shopShipOrderSchema = new mongoose.Schema({
  // Customer info
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Order number (human readable)
  order_number: {
    type: String,
    unique: true
  },
  
  // Items in this order
  items: [{
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExternalProduct',
      required: true
    },
    name: String,  // Snapshot at time of order
    price: Number,
    quantity: {
      type: Number,
      default: 1,
      min: 1
    },
    weight_kg: Number,
    thumbnail: String,
    retailer: String
  }],
  
  // Box/shipping calculation
  total_weight_kg: {
    type: Number,
    required: true
  },
  box_size: {
    type: String,
    enum: ['small', 'medium', 'large', 'extra_large'],
    required: true
  },
  box_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShippingBox'
  },
  delivery_type: {
    type: String,
    enum: ['standard', 'express'],
    default: 'standard'
  },
  
  // Pricing breakdown
  items_total: {
    type: Number,
    required: true  // Total cost of items
  },
  shipping_cost: {
    type: Number,
    required: true  // Box shipping cost (flat rate)
  },
  service_fee: {
    type: Number,
    default: 0  // Optional handling fee
  },
  discount: {
    type: Number,
    default: 0
  },
  total_amount: {
    type: Number,
    required: true  // items_total + shipping_cost + service_fee - discount
  },
  
  // Ghana delivery address
  delivery_address: {
    recipient_name: { type: String, required: true },
    phone: { type: String, required: true },
    address_line1: { type: String, required: true },
    address_line2: String,
    city: { type: String, required: true },
    region: { type: String, required: true },
    landmark: String,
    gps_address: String  // Ghana Post GPS
  },
  
  // Status tracking
  status: {
    type: String,
    enum: [
      'pending',           // Order placed, awaiting payment
      'paid',              // Payment confirmed
      'purchasing',        // Mani Me purchasing from retailers
      'purchased',         // All items bought
      'consolidating',     // Items being packed into box
      'ready_to_ship',     // Box ready at UK warehouse
      'shipped',           // Box shipped to Ghana
      'in_transit',        // Box in transit
      'customs',           // At Ghana customs
      'out_for_delivery',  // With Ghana driver
      'delivered',         // Delivered to recipient
      'cancelled',         // Order cancelled
      'refunded'           // Money refunded
    ],
    default: 'pending'
  },
  
  // Payment info
  payment_status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  payment_intent_id: String,  // Stripe payment intent
  payment_method: {
    type: String,
    enum: ['card', 'apple_pay', 'google_pay'],
    default: 'card'
  },
  
  // Tracking
  tracking_number: String,
  linked_shipment_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shipment'  // Link to shipment if consolidated
  },
  
  // Timestamps for status changes
  status_history: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  
  // Estimated dates
  estimated_purchase_date: Date,
  estimated_ship_date: Date,
  estimated_delivery_date: Date,
  actual_delivery_date: Date,
  
  // Notes
  customer_notes: String,
  admin_notes: String
}, {
  timestamps: true
});

// Generate order number before save
shopShipOrderSchema.pre('save', async function(next) {
  if (!this.order_number) {
    const count = await mongoose.model('ShopShipOrder').countDocuments();
    this.order_number = `SS-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Indexes
shopShipOrderSchema.index({ customer_id: 1, createdAt: -1 });
shopShipOrderSchema.index({ status: 1, createdAt: -1 });
shopShipOrderSchema.index({ order_number: 1 });
shopShipOrderSchema.index({ payment_status: 1 });

module.exports = mongoose.model('ShopShipOrder', shopShipOrderSchema);
