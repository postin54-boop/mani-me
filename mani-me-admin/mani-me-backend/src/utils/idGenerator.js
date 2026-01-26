// Hierarchical ID generator for bookings and parcels
module.exports.generateBookingId = function(originCode, date, bookingNumber) {
  // Example: MM-UK-2409-000123
  return `MM-${originCode}-${date}-${bookingNumber.toString().padStart(6, '0')}`;
};

module.exports.generateParcelId = function(bookingId, itemLetter) {
  // Example: MM-UK-2409-000123-A
  return `${bookingId}-${itemLetter}`;
};
