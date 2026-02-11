// ======================
// Central Validation Exports
// ======================
// All validation schemas in one place

const authValidation = require('./authValidation');
const shipmentValidation = require('./shipmentValidation');
const addressValidation = require('./addressValidation');
const paymentValidation = require('./paymentValidation');
const driverValidation = require('./driverValidation');
const groceryValidation = require('./groceryValidation');
const common = require('./common');

module.exports = {
  auth: authValidation,
  shipment: shipmentValidation,
  address: addressValidation,
  payment: paymentValidation,
  driver: driverValidation,
  grocery: groceryValidation,
  common,
};
