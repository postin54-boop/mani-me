const Booking = require('../models/booking');
const { generateBookingId } = require('../utils/idGenerator');

const User = require('../models/user');
const { sendPushNotification } = require('../services/notificationService');

exports.createBooking = async (req, res) => {
  // ...validate input, get user, etc.
  // Generate hierarchical booking ID
  const originCode = req.body.origin || 'UK';
  const date = new Date().toISOString().slice(2, 7).replace('-', ''); // YYMM
  const bookingNumber = Math.floor(Math.random() * 1000000); // Replace with sequence logic
  const id = generateBookingId(originCode, date, bookingNumber);
  const booking = new Booking({ ...req.body, id, user_id: req.user.id });
  await booking.save();

  // Notify all admins with push_token
  try {
    const admins = await User.find({ role: 'admin', push_token: { $exists: true, $ne: null } });
    const notifyPromises = admins.map(admin =>
      sendPushNotification(
        admin.push_token,
        'New Pickup Booking',
        `A user has booked a pickup. Booking ID: ${booking.id}`,
        { bookingId: booking.id, type: 'admin_pickup_booking' }
      )
    );
    await Promise.allSettled(notifyPromises);
  } catch (e) {
    // Log but don't block booking
    console.error('Admin notification error:', e);
  }

  res.status(201).json(booking);
};

// ...other booking controller methods
