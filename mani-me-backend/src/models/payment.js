const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  booking_id: { type: String, required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['card', 'cash', 'invoice'] },
  status: { type: String, default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  logs: [{ type: String }],
});

// Add indexes for performance
PaymentSchema.index({ booking_id: 1 });
PaymentSchema.index({ status: 1, createdAt: -1 });
PaymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Payment', PaymentSchema);
