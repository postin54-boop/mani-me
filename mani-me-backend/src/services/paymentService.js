// Example: Payment service with business logic
const Payment = require('../models/payment');

exports.createPayment = async (data) => {
  const payment = new Payment(data);
  await payment.save();
  return payment;
};

// ...other business logic methods
