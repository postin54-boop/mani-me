// Example: Booking service with business logic
const Booking = require('../models/booking');
const { generateBookingId } = require('../utils/idGenerator');

exports.createBooking = async (user, data) => {
  // ...validate input, check user, etc.
  const originCode = data.origin || 'UK';
  const date = new Date().toISOString().slice(2, 7).replace('-', ''); // YYMM
  const bookingNumber = Math.floor(Math.random() * 1000000); // Replace with sequence logic
  const id = generateBookingId(originCode, date, bookingNumber);
  const booking = new Booking({ ...data, id, user_id: user.id });
  await booking.save();
  return booking;
};

// ...other business logic methods
