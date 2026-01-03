// ======================
// Central Service Exports
// ======================
// All services in one place for easy importing

const addressService = require('./addressService');
const authService = require('./authService');
const bookingService = require('./bookingService');
const cashReconciliationService = require('./cashReconciliationService');
const categoryService = require('./categoryService');
const driverService = require('./driverService');
const notificationService = require('./notificationService');
const parcelPriceService = require('./parcelPriceService');
const parcelService = require('./parcelService');
const paymentService = require('./paymentService');
const shipmentService = require('./shipmentService');
const trackingService = require('./trackingService');

module.exports = {
  addressService,
  authService,
  bookingService,
  cashReconciliationService,
  categoryService,
  driverService,
  notificationService,
  parcelPriceService,
  parcelService,
  paymentService,
  shipmentService,
  trackingService,
};
