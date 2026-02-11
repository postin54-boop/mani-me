// paymentService.test.js
const paymentService = require('../services/paymentService');
const Payment = require('../models/payment');

jest.mock('../models/Payment');

describe('Payment Service', () => {
  afterEach(() => jest.clearAllMocks());

  it('should create a payment', async () => {
    Payment.prototype.save = jest.fn().mockResolvedValue(true);
    const payment = await paymentService.createPayment({ booking_id: 'BOOK123', amount: 100, method: 'card' });
    expect(payment.booking_id).toBe('BOOK123');
    expect(payment.amount).toBe(100);
    expect(payment.method).toBe('card');
  });
});
