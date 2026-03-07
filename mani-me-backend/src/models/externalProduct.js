const mongoose = require('mongoose');

/**
 * External Product Schema
 * Products mirrored from UK retailers (Amazon, Argos, Currys, Asda, Costco)
 * Curated for Ghana market - items Ghanaians typically send home
 */
const externalProductSchema = new mongoose.Schema({
  // Basic product info
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // Category - focused on Ghana demand
  category: {
    type: String,
    required: true,
    enum: [
      'electronics',      // Phones, TVs, laptops, tablets
      'kitchen',          // Blenders, rice cookers, microwaves, kettles
      'baby',             // Formula, diapers, clothes, toys
      'food',             // Tinned goods, cereals, spices, snacks
      'household',        // Bedding, towels, cleaning supplies
      'clothing',         // Shoes, bags, fashion items
      'health',           // Vitamins, supplements, medical supplies
      'beauty'            // Skincare, haircare, cosmetics
    ]
  },
  subcategory: {
    type: String,
    default: ''
  },
  
  // Pricing
  price: {
    type: Number,
    required: true,
    min: 0
  },
  original_price: {
    type: Number,  // Original retailer price for showing discounts
    default: null
  },
  currency: {
    type: String,
    default: 'GBP'
  },
  
  // Images
  images: [{
    type: String  // Array of image URLs
  }],
  thumbnail: {
    type: String
  },
  
  // External retailer info
  retailer: {
    type: String,
    required: true,
    enum: ['amazon', 'argos', 'currys', 'asda', 'costco', 'tesco', 'manual']
  },
  retailer_url: {
    type: String,  // Link to original product
    default: null
  },
  retailer_product_id: {
    type: String,  // ASIN for Amazon, SKU for others
    default: null
  },
  
  // Weight & dimensions for box calculation
  weight_kg: {
    type: Number,
    required: true,
    min: 0.1
  },
  dimensions: {
    length_cm: { type: Number, default: 0 },
    width_cm: { type: Number, default: 0 },
    height_cm: { type: Number, default: 0 }
  },
  
  // Stock & availability
  in_stock: {
    type: Boolean,
    default: true
  },
  stock_quantity: {
    type: Number,
    default: 100
  },
  
  // Popularity & sorting
  popularity: {
    type: Number,
    default: 0  // Incremented on purchase
  },
  featured: {
    type: Boolean,
    default: false
  },
  
  // Admin controls
  is_active: {
    type: Boolean,
    default: true
  },
  added_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  last_synced: {
    type: Date,
    default: null  // Last time price/stock was synced from retailer
  },
  
  // SEO & search
  tags: [{
    type: String
  }],
  
  // Ghana-specific
  ghana_popular: {
    type: Boolean,
    default: true  // Is this item popular in Ghana?
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
externalProductSchema.index({ category: 1, is_active: 1, in_stock: 1 });
externalProductSchema.index({ retailer: 1, retailer_product_id: 1 });
externalProductSchema.index({ featured: -1, popularity: -1 });
externalProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
externalProductSchema.index({ price: 1 });
externalProductSchema.index({ weight_kg: 1 });

module.exports = mongoose.model('ExternalProduct', externalProductSchema);
