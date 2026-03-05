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

/**
 * Create a payment intent with manual capture (pre-authorization)
 * This holds the funds but doesn't charge until capture is called
 */
exports.createIntent = async (req, res) => {
  try {
    const { amount, currency = 'gbp', shipmentId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // Amount is already in smallest currency unit (pence) from mobile app
    // Use capture_method: 'manual' for pre-authorization (hold, don't charge yet)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // Already in pence, just ensure it's an integer
      currency,
      capture_method: 'manual', // PRE-AUTHORIZATION: Hold funds, capture later on pickup
      automatic_payment_methods: { enabled: true },
      metadata: { shipmentId: shipmentId || '' }, // Store shipment ID for webhook
    });

    // If shipment ID provided, store the payment intent ID on the shipment
    if (shipmentId) {
      const Shipment = require('../models/shipment');
      await Shipment.findByIdAndUpdate(shipmentId, { 
        payment_intent_id: paymentIntent.id,
        payment_status: 'authorized' // Mark as authorized (held), not paid yet
      });
    }

    logger.info('Payment intent created (pre-auth)', { paymentIntentId: paymentIntent.id, amount, shipmentId });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
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

/**
 * Capture a pre-authorized payment (called when driver confirms pickup)
 * This actually charges the customer's card
 */
exports.capturePayment = async (req, res) => {
  try {
    const { shipmentId } = req.body;
    
    if (!shipmentId) {
      return res.status(400).json({ error: 'shipmentId is required' });
    }

    const Shipment = require('../models/shipment');
    const shipment = await Shipment.findById(shipmentId);
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (!shipment.payment_intent_id) {
      // Cash payment - no capture needed
      if (shipment.payment_method === 'cash') {
        return res.json({ success: true, message: 'Cash payment - no capture needed' });
      }
      return res.status(400).json({ error: 'No payment intent found for this shipment' });
    }

    if (shipment.payment_status === 'paid') {
      return res.json({ success: true, message: 'Payment already captured' });
    }

    // Capture the pre-authorized payment
    const paymentIntent = await stripe.paymentIntents.capture(shipment.payment_intent_id);
    
    // Update shipment payment status
    shipment.payment_status = 'paid';
    shipment.paid_at = new Date();
    await shipment.save();

    logger.info('Payment captured successfully', { 
      shipmentId, 
      paymentIntentId: shipment.payment_intent_id,
      amount: paymentIntent.amount 
    });

    res.json({ 
      success: true, 
      message: 'Payment captured successfully',
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    logger.error('Payment capture error', { error: error.message, shipmentId: req.body.shipmentId });
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      if (error.message.includes('already been captured')) {
        return res.json({ success: true, message: 'Payment was already captured' });
      }
      if (error.message.includes('has expired')) {
        return res.status(400).json({ error: 'Authorization has expired. Customer must pay again.' });
      }
    }
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancel a pre-authorized payment (release the hold)
 * Called when a booking is cancelled before pickup
 */
exports.cancelAuthorization = async (req, res) => {
  try {
    const { shipmentId } = req.body;
    
    if (!shipmentId) {
      return res.status(400).json({ error: 'shipmentId is required' });
    }

    const Shipment = require('../models/shipment');
    const shipment = await Shipment.findById(shipmentId);
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (!shipment.payment_intent_id) {
      // No payment to cancel
      return res.json({ success: true, message: 'No payment authorization to cancel' });
    }

    if (shipment.payment_status === 'paid') {
      return res.status(400).json({ error: 'Payment already captured - use refund instead' });
    }

    // Cancel the payment intent to release the hold
    const paymentIntent = await stripe.paymentIntents.cancel(shipment.payment_intent_id);
    
    // Update shipment
    shipment.payment_status = 'cancelled';
    await shipment.save();

    logger.info('Payment authorization cancelled', { 
      shipmentId, 
      paymentIntentId: shipment.payment_intent_id 
    });

    res.json({ 
      success: true, 
      message: 'Authorization cancelled - funds released to customer',
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status
      }
    });
  } catch (error) {
    logger.error('Cancel authorization error', { error: error.message, shipmentId: req.body.shipmentId });
    
    // Handle already cancelled
    if (error.message.includes('already been canceled')) {
      return res.json({ success: true, message: 'Authorization was already cancelled' });
    }
    
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get payment status for a shipment
 */
exports.getPaymentStatus = async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    const Shipment = require('../models/shipment');
    const shipment = await Shipment.findById(shipmentId).select('payment_intent_id payment_status payment_method');
    
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    let stripeStatus = null;
    if (shipment.payment_intent_id) {
      const paymentIntent = await stripe.paymentIntents.retrieve(shipment.payment_intent_id);
      stripeStatus = {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        capturable: paymentIntent.amount_capturable,
        captured: paymentIntent.amount_received
      };
    }

    res.json({
      shipmentId,
      paymentMethod: shipment.payment_method,
      paymentStatus: shipment.payment_status,
      stripe: stripeStatus
    });
  } catch (error) {
    logger.error('Get payment status error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};
