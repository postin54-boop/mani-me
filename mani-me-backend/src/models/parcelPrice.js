const mongoose = require('mongoose');

const parcelPriceSchema = new mongoose.Schema({
  type: { type: String, required: true, unique: true }, // e.g. 'small_box', 'medium_box', 'large_box', 'tv', 'drum'
  label: { type: String, required: true }, // e.g. 'Small Box', 'Medium Box', etc.
  price: { type: Number, required: true },
  currency: { type: String, default: 'GBP' },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParcelPrice', parcelPriceSchema);
