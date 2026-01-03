// ======================
// Central Model Exports
// ======================
// All models in one place for easy importing

// Core Models
const User = require('./user');
const Shipment = require('./shipment');
const Item = require('./item');
const Address = require('./address');

// Booking & Tracking
const Booking = require('./booking');
const TrackingEvent = require('./trackingEvent');
const ParcelItem = require('./parcelItem');
const ParcelPrice = require('./parcelPrice');

// Payments & Orders
const Payment = require('./payment');
const GroceryItem = require('./groceryItem');
const GroceryOrder = require('./groceryOrder');
const PackagingItem = require('./packagingItem');
const PackagingOrder = require('./packagingOrder');

// System & Settings
const Settings = require('./settings');
const Notification = require('./notification');
const Message = require('./message');
const Category = require('./category');
const Product = require('./product');
const CashReconciliation = require('./cashReconciliation');

module.exports = {
  // Core
  User,
  Shipment,
  Item,
  Address,
  
  // Booking & Tracking
  Booking,
  TrackingEvent,
  ParcelItem,
  ParcelPrice,
  
  // Payments & Orders
  Payment,
  GroceryItem,
  GroceryOrder,
  PackagingItem,
  PackagingOrder,
  
  // System & Settings
  Settings,
  Notification,
  Message,
  Category,
  Product,
  CashReconciliation,
  
  // Lowercase aliases for backward compatibility
  user: User,
  shipment: Shipment,
  item: Item,
  address: Address,
};
