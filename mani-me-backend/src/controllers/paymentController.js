/**
 * Payment Controller
 * Handles Stripe payments and promo code validation
 * @module controllers/paymentController
 */

const logger = require('../utils/logger');
const PromoCode = require('../models/promoCode');

// Stripe initialization
if (!process.env.STRIPE_SECRET_KEY) {
  logger.error('STRIPE_SECRET_KEY not set - payments will fail');
}
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.validatePromo = async (req, res) => {
  try {
    const { code, orderValue } = req.body;
    if (!code) return res.status(400).json({ valid: false, message: 'Promo code is required' });

    const promo = await PromoCode.findOne({ code: code.toUpperCase(), status: 'active' });
    if (!promo) return res.status(404).json({ valid: false, message: 'Invalid promo code' });

    if (new Date(promo.expiryDate) < new Date()) {
      promo.status = 'expired';
      await promo.save();
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    if (promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Promo code usage limit reached' });
    }

    if (orderValue && orderValue < promo.minOrderValue) {
      return res.status(400).json({ valid: false, message: `Minimum order value of £${promo.minOrderValue} required` });
    }

    let discount = 0;
    if (orderValue) {
      if (promo.type === 'percentage') {
        discount = orderValue * (promo.value / 100);
        if (promo.maxDiscount && discount > promo.maxDiscount) discount = promo.maxDiscount;
      } else {
        discount = promo.value;
      }
    }

    res.json({
      valid: true,
      promo: { id: promo._id, code: promo.code, type: promo.type, value: promo.value, description: promo.description },
      discount: Math.round(discount * 100) / 100
    });
  } catch (error) {
    logger.error('Promo validation error', { error: error.message });
    res.status(500).json({ valid: false, message: 'Server error' });
  }
};

exports.createIntent = async (req, res) => {
  try {
    const { amount, currency = 'gbp', shipmentId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // Amount is already in smallest currency unit (pence) from mobile app
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Already in pence, just ensure it's an integer
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { shipmentId: shipmentId || '' }, // Store shipment ID for webhook
    });

    // If shipment ID provided, store the payment intent ID on the shipment
    if (shipmentId) {
      const Shipment = require('../models/shipment');
      await Shipment.findByIdAndUpdate(shipmentId, { payment_intent_id: paymentIntent.id });
    }

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    logger.error('Payment intent error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const Shipment = require('../models/shipment');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;

  switch (event.type) {
    case 'payment_intent.succeeded':
      logger.info('PaymentIntent succeeded', { paymentIntentId });
      try {
        // Update shipment payment status
        const shipment = await Shipment.findOneAndUpdate(
          { payment_intent_id: paymentIntentId },
          { 
            payment_status: 'paid',
            paid_at: new Date()
          },
          { new: true }
        );
        if (shipment) {
          logger.info('Shipment payment updated', { shipmentId: shipment._id, status: 'paid' });
          // TODO: Send payment confirmation notification
        } else {
          logger.warn('No shipment found for payment intent', { paymentIntentId });
        }
      } catch (dbError) {
        logger.error('Failed to update shipment payment status', { error: dbError.message, paymentIntentId });
      }
      break;
    case 'payment_intent.payment_failed':
      logger.warn('Payment failed', { paymentIntentId });
      try {
        await Shipment.findOneAndUpdate(
          { payment_intent_id: paymentIntentId },
          { payment_status: 'pending' } // Reset to pending on failure
        );
      } catch (dbError) {
        logger.error('Failed to update shipment on payment failure', { error: dbError.message });
      }
      break;
    case 'charge.refunded':
      logger.info('Charge refunded', { paymentIntentId });
      try {
        await Shipment.findOneAndUpdate(
          { payment_intent_id: paymentIntentId },
          { payment_status: 'refunded' }
        );
      } catch (dbError) {
        logger.error('Failed to update shipment refund status', { error: dbError.message });
      }
      break;
    default:
      logger.debug('Unhandled webhook event', { type: event.type });
  }

  res.json({ received: true });
};
