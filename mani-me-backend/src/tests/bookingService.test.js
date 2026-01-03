// bookingService.test.js
const bookingService = require('../services/bookingService');
const Booking = require('../models/booking');

jest.mock('../models/Booking');

describe('Booking Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('should create a booking with hierarchical ID', async () => {
    const user = { id: 'user123' };
    const data = { origin: 'UK' };
    Booking.prototype.save = jest.fn().mockResolvedValue(true);
    const booking = await bookingService.createBooking(user, data);
    expect(booking.id).toMatch(/^MM-UK-\d{4}-\d{6}$/);
    expect(booking.user_id).toBe(user.id);
  });
});
