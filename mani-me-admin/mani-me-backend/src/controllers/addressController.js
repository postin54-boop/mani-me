// ======================
// Address Controller
// ======================
const addressService = require('../services/addressService');
const { asyncHandler, NotFoundError, BadRequestError } = require('../middleware/errorHandler');
const { success, created } = require('../utils/response');

// Create a new address
exports.createAddress = asyncHandler(async (req, res) => {
  const address = await addressService.createAddress(req.body);
  return created(res, address, 'Address created successfully');
});

// Get all addresses for a user
exports.getAddresses = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const addresses = await addressService.getAddressesByUser(userId);
  return success(res, addresses);
});

// Update an address
exports.updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const address = await addressService.updateAddress(addressId, req.body);
  return success(res, address, 'Address updated successfully');
});

// Delete an address
exports.deleteAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  await addressService.deleteAddress(addressId);
  return success(res, null, 'Address deleted successfully');
});
