const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  label: { type: String, required: true }, // e.g., Home, Work
  addressLine: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String },
  country: { type: String },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Address", addressSchema);
