const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment" },
  description: String,
  weight: Number,
  value: Number,
});

// Add index for performance
itemSchema.index({ shipmentId: 1 });

module.exports = mongoose.model("Item", itemSchema);
