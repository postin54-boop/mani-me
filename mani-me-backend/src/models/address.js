const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  label: { type: String, required: true },
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String },
  country: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
});

addressSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Address", addressSchema);
