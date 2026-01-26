// ======================
// Parcel Price Service
// ======================
// Business logic for parcel pricing

const ParcelPrice = require('../models/parcelPrice');

/**
 * Get all parcel prices
 * @returns {Promise<Array>} List of prices
 */
const getAllPrices = async () => {
  return await ParcelPrice.find();
};

/**
 * Get price by type
 * @param {string} type - Price type (e.g., 'small', 'medium', 'large')
 * @returns {Promise<Object>} Price record
 */
const getPriceByType = async (type) => {
  const price = await ParcelPrice.findOne({ type });
  if (!price) {
    throw new Error(`Price not found for type: ${type}`);
  }
  return price;
};

/**
 * Create or update a parcel price
 * @param {Object} priceData - Price details
 * @returns {Promise<Object>} Updated/created price
 */
const upsertPrice = async (priceData) => {
  const { type, label, price, currency } = priceData;
  
  if (!type) {
    throw new Error('Price type is required');
  }
  
  const updated = await ParcelPrice.findOneAndUpdate(
    { type },
    { label, price, currency, lastUpdated: new Date() },
    { upsert: true, new: true }
  );
  
  return updated;
};

/**
 * Delete a price by type
 * @param {string} type - Price type
 * @returns {Promise<Object>} Deleted price
 */
const deletePrice = async (type) => {
  const price = await ParcelPrice.findOneAndDelete({ type });
  if (!price) {
    throw new Error(`Price not found for type: ${type}`);
  }
  return price;
};

/**
 * Calculate shipping cost based on parcel details
 * @param {string} size - Parcel size type
 * @param {number} weight - Weight in kg
 * @returns {Promise<Object>} Calculated price info
 */
const calculateShippingCost = async (size, weight) => {
  const basePrice = await ParcelPrice.findOne({ type: size });
  if (!basePrice) {
    throw new Error(`No price configured for size: ${size}`);
  }
  
  // Base price + weight surcharge (£2 per kg over 5kg)
  let totalPrice = basePrice.price;
  if (weight > 5) {
    totalPrice += (weight - 5) * 2;
  }
  
  return {
    basePrice: basePrice.price,
    weightSurcharge: weight > 5 ? (weight - 5) * 2 : 0,
    totalPrice,
    currency: basePrice.currency || 'GBP',
  };
};

module.exports = {
  getAllPrices,
  getPriceByType,
  upsertPrice,
  deletePrice,
  calculateShippingCost,
};
