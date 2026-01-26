const Payment = require('../models/payment');

exports.createPayment = async (req, res) => {
  // ...validate input
  const payment = new Payment(req.body);
  await payment.save();
  res.status(201).json(payment);
};

// ...other payment controller methods
