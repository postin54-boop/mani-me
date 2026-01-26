// ======================
// Central Controller Exports
// ======================
// All controllers in one place for easy importing

const addressController = require('./addressController');
const authController = require('./authController');
const bookingController = require('./bookingController');
const cashReconciliationController = require('./cashReconciliationController');
const categoryController = require('./categoryController');
const driverController = require('./driverController');
const notificationController = require('./notificationController');
const parcelController = require('./parcelController');
const parcelPriceController = require('./parcelPriceController');
const paymentController = require('./paymentController');
const shipmentController = require('./shipmentController');
const trackingController = require('./trackingController');

module.exports = {
  addressController,
  authController,
  bookingController,
  cashReconciliationController,
  categoryController,
  driverController,
  notificationController,
  parcelController,
  parcelPriceController,
  paymentController,
  shipmentController,
  trackingController,
};
