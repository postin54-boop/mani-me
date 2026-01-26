// utils/generateParcelId.js
// Generates a unique parcel/item ID for tracking and global uniqueness
// Format: MM-USERID-SHIPMENTID-ITEMNUMBER

module.exports = function generateParcelId(userId, shipmentId, itemNumber) {
  return `MM-${userId}-${shipmentId}-${itemNumber}`;
};
