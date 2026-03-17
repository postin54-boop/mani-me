jest.mock('../models/booking', () => {
  return jest.fn().mockImplementation(function BookingModel(data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  });
});

const bookingService = require('../services/bookingService');
const Booking = require('../models/booking');

describe('Booking Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('creates a booking with hierarchical ID and user linkage', async () => {
    const user = { id: 'user123' };
    const data = { origin: 'UK', receiver_name: 'Test Receiver' };

    const booking = await bookingService.createBooking(user, data);

    expect(booking.id).toMatch(/^MM-UK-\d{4}-\d{6}$/);
    expect(booking.user_id).toBe('user123');
    expect(Booking).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: 'UK',
        receiver_name: 'Test Receiver',
        user_id: 'user123',
      })
    );
  });
});
