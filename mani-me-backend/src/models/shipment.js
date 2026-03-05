const mongoose = require("mongoose");

const shipmentSchema = new mongoose.Schema({
  userId: { type: String, required: false, default: 'guest' }, // Optional for guest bookings
  
  // Parcel ID fields
  parcel_id: { type: String }, // Full parcel ID (e.g., MM-2026-001234-ABC)
  parcel_id_short: { type: String }, // Short parcel ID (e.g., MM001234)
  parcel_size: { type: String }, // small, medium, large, extra_large
  
  // Self drop-off option
  is_self_dropoff: { type: Boolean, default: false }, // Customer brings parcel to warehouse
  
  pickupAddress: { type: String },
  destination: { type: String },
  itemCount: { type: Number },
  cost: { type: Number },
  status: { type: String, default: "pending" },

  // Warehouse status
  warehouse_status: {
    type: String,
    enum: ['not_arrived', 'received', 'sorted', 'packed', 'shipped'],
    default: 'not_arrived'
  },

  // Sender Details (UK-based)
  sender_name: { type: String },
  sender_phone: { type: String },
  sender_email: { type: String },

  // Pickup Address (UK)
  pickup_address: { type: String },
  pickup_city: { type: String },
  pickup_postcode: { type: String },
  pickup_date: { type: Date },
  pickup_time: { type: String },

  // Receiver Details (Ghana-based)
  receiver_name: { type: String },
  receiver_phone: { type: String },
  receiver_alternate_phone: { type: String },

  // Delivery Address (Ghana)
  delivery_address: { type: String },
  delivery_city: { type: String },
  delivery_region: { type: String },

  // Parcel Details
  weight_kg: { type: Number, default: 1 },
  dimensions: { type: String }, // Format: LxWxH in cm
  parcel_description: { type: String },
  parcel_value: { type: Number }, // Declared value in GBP

  // Payment & Pricing
  payment_method: {
    type: String,
    enum: ['card', 'cash', 'apple_pay'],
    default: 'card'
  },
  payment_status: {
    type: String,
    enum: ['pending', 'authorized', 'paid', 'refunded', 'cancelled'],
    default: 'pending'
  },
  payment_intent_id: { type: String }, // Stripe payment intent ID
  payment_notes: { type: String }, // Notes for payment issues
  paid_at: { type: Date }, // When payment was captured
  total_cost: { type: Number, default: 0.00 },

  // Tracking & Status
  tracking_number: { type: String },
  shipment_status: {
    type: String,
    enum: [
      'booked',              // 1. Customer booked shipment
      'pending_pickup',      // 2. Waiting for driver assignment
      'driver_assigned',     // 3. UK driver assigned
      'driver_en_route',     // 4. UK driver on way to pickup
      'picked_up',           // 5. Parcel collected by UK driver
      'at_uk_warehouse',     // 6. Arrived at UK warehouse
      'processing',          // 7. Being sorted/packed at warehouse
      'departed_uk',         // 8. Shipped from UK
      'in_transit',          // 9. In transit to Ghana
      'arrived_ghana',       // 10. Arrived at Ghana warehouse
      'customs',             // 11. In customs clearance
      'customs_cleared',     // 12. Cleared customs
      'out_for_delivery',    // 13. Ghana driver delivering
      'delivered',           // 14. Successfully delivered
      'cancelled',           // Cancelled
      'on_hold',             // On hold (issue)
      'returned'             // Returned to sender
    ],
    default: 'booked'
  },

  // Driver Assignments
  pickup_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  delivery_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Delivery Proof
  proof_of_delivery: { type: String }, // Image URL
  recipient_signature_name: { type: String },
  delivery_notes: { type: String },

  // Timestamps for each status (expanded)
  booked_at: { type: Date },
  pending_pickup_at: { type: Date },
  driver_assigned_at: { type: Date },
  driver_en_route_at: { type: Date },
  picked_up_at: { type: Date },
  at_uk_warehouse_at: { type: Date },
  processing_at: { type: Date },
  departed_uk_at: { type: Date },
  in_transit_at: { type: Date },
  arrived_ghana_at: { type: Date },
  customs_at: { type: Date },
  customs_cleared_at: { type: Date },
  out_for_delivery_at: { type: Date },
  delivered_at: { type: Date },
  cancelled_at: { type: Date },
  on_hold_at: { type: Date },
  returned_at: { type: Date },

  // QR Code & Images
  qr_code_url: { type: String },
  qr_code_data: { type: String }, // JSON string of QR code data
  parcel_image_url: { type: String },
  customer_photo_url: { type: String },
  
  // Ghana destination
  ghana_destination: { type: String }, // Combined city/region for Ghana delivery
  
  // Special Instructions
  special_instructions: { type: String },

  // User can hide cancelled/delivered orders from their list
  hidden_by_user: { type: Boolean, default: false },

  // Additional fields as needed
}, { timestamps: true });

// ========================================
// AUTO-GENERATE TRACKING NUMBER
// ========================================
shipmentSchema.pre('save', async function() {
  if (!this.tracking_number) {
    // Generate tracking number: MM + timestamp + random 4 digits
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(1000 + Math.random() * 9000);
    this.tracking_number = `MM${timestamp}${random}`;
  }
});

// ========================================
// INDEXES FOR SCALABILITY (50k+ users)
// ========================================

// Primary lookup indexes
shipmentSchema.index({ userId: 1, createdAt: -1 }); // User's shipments (most common query)
shipmentSchema.index({ tracking_number: 1 }, { unique: true, sparse: true }); // Tracking lookups
shipmentSchema.index({ parcel_id: 1 }, { sparse: true }); // Parcel ID lookups
shipmentSchema.index({ parcel_id_short: 1 }, { sparse: true }); // Short parcel ID lookups

// Status-based queries
shipmentSchema.index({ shipment_status: 1, createdAt: -1 }); // Filter by status
shipmentSchema.index({ warehouse_status: 1 }); // Warehouse filtering
shipmentSchema.index({ payment_status: 1 }); // Payment filtering

// Driver assignment queries
shipmentSchema.index({ pickup_driver_id: 1, shipment_status: 1 }); // UK driver pickups
shipmentSchema.index({ delivery_driver_id: 1, shipment_status: 1 }); // Ghana driver deliveries

// Date-based queries for reporting
shipmentSchema.index({ pickup_date: 1 }); // Scheduled pickups
shipmentSchema.index({ delivered_at: 1 }); // Delivery reports

// Search indexes (phone/email lookups)
shipmentSchema.index({ sender_phone: 1 }); // Phone search
shipmentSchema.index({ sender_email: 1 }); // Email search
shipmentSchema.index({ receiver_phone: 1 }); // Receiver phone search

// Compound index for admin dashboard
shipmentSchema.index({ shipment_status: 1, pickup_city: 1, createdAt: -1 });

module.exports = mongoose.model("Shipment", shipmentSchema);
