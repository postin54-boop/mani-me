// Example: Parcel service with business logic
const ParcelItem = require('../models/parcelItem');
const { generateParcelId } = require('../utils/idGenerator');

exports.createParcelItem = async (bookingId, itemType, itemLetter, data) => {
  // ...validate input, check booking, etc.
  const id = generateParcelId(bookingId, itemLetter);
  const parcel = new ParcelItem({ ...data, id, booking_id: bookingId, item_type: itemType });
  await parcel.save();
  return parcel;
};

// ...other business logic methods
