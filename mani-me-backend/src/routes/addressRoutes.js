const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const validate = require('../middleware/validate');
const { address: addressValidation } = require('../validations');

// Create address
router.post('/', validate(addressValidation.createAddress), addressController.createAddress);

// Get all addresses for a user
router.get('/:userId', validate(addressValidation.getByUser), addressController.getAddresses);

// Update address
router.put('/:addressId', validate(addressValidation.updateAddress), addressController.updateAddress);

// Delete address
router.delete('/:addressId', validate(addressValidation.deleteAddress), addressController.deleteAddress);

module.exports = router;
