// src/models/cashReconciliation.js
const mongoose = require('mongoose');

const cashReconciliationSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  photoUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
  
  // Enhanced fields for tracking
  shipments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shipment' }],
  expectedAmount: { type: Number, default: 0 },
  discrepancy: { type: Number, default: 0 },
  currency: { type: String, default: 'GBP' },
  shiftDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('CashReconciliation', cashReconciliationSchema);
