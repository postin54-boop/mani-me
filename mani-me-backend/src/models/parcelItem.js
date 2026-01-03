const mongoose = require('mongoose');

const ParcelItemSchema = new mongoose.Schema({
  id: { type: String, unique: true }, // hierarchical
  booking_id: { type: String, required: true },
  item_type: { type: String, required: true },
  label_code: { type: String },
  weight: { type: Number },
  size: { type: String },
  status: { type: String, default: 'created' }, // e.g. 'in-stock', 'in-transit', 'delivered'
  warehouseLocation: { type: String, enum: ['UK', 'Ghana'], required: true },
  // ...other fields
});

module.exports = mongoose.model('ParcelItem', ParcelItemSchema);
