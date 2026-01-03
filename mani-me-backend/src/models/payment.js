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

module.exports = mongoose.model('Payment', PaymentSchema);
