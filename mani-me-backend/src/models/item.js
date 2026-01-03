const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  shipmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Shipment" },
  description: String,
  weight: Number,
  value: Number,
});

module.exports = mongoose.model("Item", itemSchema);
