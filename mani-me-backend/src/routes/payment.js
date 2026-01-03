const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { payment: paymentValidation } = require('../validations');

// Stripe initialization - MUST have secret key
if (!process.env.STRIPE_SECRET_KEY) {
  console.error('⚠️  WARNING: STRIPE_SECRET_KEY not set - payments will fail');
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// In-memory promo codes (in production, use database)
const promoCodes = [
  {
    code: 'WELCOME10',
    type: 'percentage',
    value: 10,
    description: 'Welcome offer for new customers',
    expiryDate: '2025-12-31',
    usageLimit: 100,
    usedCount: 23,
    minOrderValue: 20,
    status: 'active'
  },
  {
    code: 'FESTIVE25',
    type: 'percentage',
    value: 25,
    description: 'Festive season special',
    expiryDate: '2025-12-25',
    usageLimit: 50,
    usedCount: 8,
    minOrderValue: 50,
    status: 'active'
  },
  {
    code: 'FLAT5',
    type: 'fixed',
    value: 5,
    description: 'Flat £5 off on all orders',
    expiryDate: '2026-01-31',
    usageLimit: 200,
    usedCount: 145,
    minOrderValue: 15,
    status: 'active'
  },
];

// Validate promo code
router.post('/validate-promo', async (req, res) => {
  try {
    const { code, orderValue } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, message: 'Promo code is required' });
    }

    // Find promo code
    const promo = promoCodes.find(p => p.code === code.toUpperCase() && p.status === 'active');

    if (!promo) {
      return res.status(404).json({ valid: false, message: 'Invalid promo code' });
    }

    // Check expiry
    if (new Date(promo.expiryDate) < new Date()) {
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    // Check usage limit
    if (promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Promo code usage limit reached' });
    }

    // Check minimum order value
    if (orderValue < promo.minOrderValue) {
      return res.status(400).json({ 
        valid: false, 
        message: `Minimum order value of £${promo.minOrderValue} required` 
      });
    }

    // Calculate discount
    let discount = 0;
    if (promo.type === 'percentage') {
      discount = orderValue * (promo.value / 100);
    } else {
      discount = promo.value;
    }

    return res.json({
      valid: true,
      promo: {
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description
      },
      discount: discount
    });
  } catch (error) {
    console.error('Promo validation error:', error);
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// Create payment intent
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, currency = 'gbp' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create a PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to pence/cents
      currency: currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook to handle payment events (optional but recommended)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('PaymentIntent was successful!', paymentIntent.id);
      // You can update your database here
      break;
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

module.exports = router;
