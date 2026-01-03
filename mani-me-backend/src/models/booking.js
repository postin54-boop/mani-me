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

module.exports = mongoose.model('Booking', BookingSchema);
