// ======================
// Address Service
// ======================
// Business logic for address management

const Address = require('../models/address');
const { NotFoundError, BadRequestError } = require('../utils/errors');

/**
 * Create a new address for a user
 * @param {Object} addressData - Address details
 * @returns {Promise<Object>} Created address
 */
const createAddress = async (addressData) => {
  const { userId, label, addressLine, city, region, country, phone } = addressData;
  
  if (!userId || !label || !addressLine || !city) {
    throw new BadRequestError('Missing required fields: userId, label, addressLine, city');
  }
  
  const address = new Address({ userId, label, addressLine, city, region, country, phone });
  await address.save();
  return address;
};

/**
 * Get all addresses for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} List of addresses
 */
const getAddressesByUser = async (userId) => {
  if (!userId) {
    throw new BadRequestError('userId is required');
  }
  return await Address.find({ userId });
};

/**
 * Update an address
 * @param {string} addressId - Address ID
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Updated address
 */
const updateAddress = async (addressId, updateData) => {
  const address = await Address.findByIdAndUpdate(addressId, updateData, { new: true });
  if (!address) {
    throw new NotFoundError('Address');
  }
  return address;
};

/**
 * Delete an address
 * @param {string} addressId - Address ID
 * @returns {Promise<Object>} Deleted address
 */
const deleteAddress = async (addressId) => {
  const address = await Address.findByIdAndDelete(addressId);
  if (!address) {
    throw new NotFoundError('Address');
  }
  return address;
};

/**
 * Get a single address by ID
 * @param {string} addressId - Address ID
 * @returns {Promise<Object>} Address
 */
const getAddressById = async (addressId) => {
  const address = await Address.findById(addressId);
  if (!address) {
    throw new NotFoundError('Address');
  }
  return address;
};

module.exports = {
  createAddress,
  getAddressesByUser,
  updateAddress,
  deleteAddress,
  getAddressById,
};
