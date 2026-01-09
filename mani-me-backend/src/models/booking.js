const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // hierarchical
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, default: 'pending' },
  pricing_status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  // ...other fields
});

// Add indexes for performance
BookingSchema.index({ user_id: 1, createdAt: -1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Booking', BookingSchema);
