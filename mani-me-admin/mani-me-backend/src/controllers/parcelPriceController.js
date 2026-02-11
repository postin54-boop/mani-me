// ======================
// Parcel Price Controller
// ======================
const parcelPriceService = require('../services/parcelPriceService');

// Get all parcel prices
exports.getAllParcelPrices = async (req, res) => {
  try {
    const prices = await parcelPriceService.getAllPrices();
    res.json(prices);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching parcel prices', error: err.message });
  }
};

// Add or update a parcel price
exports.upsertParcelPrice = async (req, res) => {
  try {
    const updated = await parcelPriceService.upsertPrice(req.body);
    res.json(updated);
  } catch (err) {
    if (err.message === 'Price type is required') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Error saving parcel price', error: err.message });
  }
};

// Calculate shipping cost
exports.calculateCost = async (req, res) => {
  try {
    const { size, weight } = req.query;
    const cost = await parcelPriceService.calculateShippingCost(size, parseFloat(weight) || 0);
    res.json(cost);
  } catch (err) {
    res.status(500).json({ message: 'Error calculating cost', error: err.message });
  }
};
