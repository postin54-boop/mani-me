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
 * Create a payment intent
 * - For shipments (shipmentId provided): Use manual capture (pre-authorization)
 * - For grocery/other orders: Use automatic capture (immediate charge)
 */
exports.createIntent = async (req, res) => {
  try {
    const { amount, currency = 'gbp', shipmentId, orderId } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    // Determine capture method based on order type
    // - shipmentId: Pre-authorize only (capture on pickup)
    // - orderId or no ID: Immediate capture (grocery orders, etc.)
    const isPreAuth = !!shipmentId && !orderId;
    
    const paymentIntentOptions = {
      amount: Math.round(amount), // Already in pence, just ensure it's an integer
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: { 
        shipmentId: shipmentId || '',
        orderId: orderId || ''
      },
    };
    
    // Only use manual capture for shipment pre-authorization
    if (isPreAuth) {
      paymentIntentOptions.capture_method = 'manual';
    }
    // else: defaults to 'automatic' - charges immediately
    
    const paymentIntent = await stripe.paymentIntents.create(paymentIntentOptions);

    // If shipment ID provided, store the payment intent ID on the shipment
    if (shipmentId) {
      const Shipment = require('../models/shipment');
      await Shipment.findByIdAndUpdate(shipmentId, { 
        payment_intent_id: paymentIntent.id,
        payment_status: isPreAuth ? 'authorized' : 'paid'
      });
    }

    logger.info('Payment intent created', { 
      paymentIntentId: paymentIntent.id, 
      amount, 
      shipmentId, 
      orderId,
      captureMethod: isPreAuth ? 'manual' : 'automatic'
    });
    res.json({ clientSecret: paymentIntent.client_secret, paymentIntentId: paymentIntent.id });
  } catch (error) {
    logger.error('Payment intent error', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  // Import all order models
  const Shipment = require('../models/shipment');
  const GroceryOrder = require('../models/groceryOrder');
  const ShopShipOrder = require('../models/shopShipOrder');
  const { sendPushNotification } = require('../services/notificationService');
  const User = require('../models/user');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed', { error: err.message });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  const paymentIntent = event.data.object;
  const paymentIntentId = paymentIntent.id;

  /**
   * Helper: Find order by payment_intent_id across all models
   * Returns { order, type, model } or null
   */
  const findOrderByPaymentIntent = async (piId) => {
    // Check Shipment first (most common)
    let order = await Shipment.findOne({ payment_intent_id: piId }).populate('userId', 'push_token email fullName');
    if (order) return { order, type: 'shipment', model: Shipment };
    
    // Check GroceryOrder
    order = await GroceryOrder.findOne({ payment_intent_id: piId }).populate('user_id', 'push_token email fullName');
    if (order) return { order, type: 'grocery', model: GroceryOrder };
    
    // Check ShopShipOrder
    order = await ShopShipOrder.findOne({ payment_intent_id: piId }).populate('customer_id', 'push_token email fullName');
    if (order) return { order, type: 'shopship', model: ShopShipOrder };
    
    return null;
  };

  /**
   * Helper: Get user from order based on type
   */
  const getUserFromOrder = (result) => {
    if (!result) return null;
    if (result.type === 'shipment') return result.order.userId;
    if (result.type === 'grocery') return result.order.user_id;
    if (result.type === 'shopship') return result.order.customer_id;
    return null;
  };

  /**
   * Helper: Send payment notification to customer
   */
  const sendPaymentNotification = async (user, orderType, trackingNumber, success = true) => {
    if (!user?.push_token) return;
    
    const title = success ? '✅ Payment Successful' : '❌ Payment Failed';
    let body;
    
    if (success) {
      body = orderType === 'shipment' 
        ? `Payment confirmed for parcel ${trackingNumber}. We'll notify you when your pickup is scheduled.`
        : orderType === 'grocery'
        ? `Payment confirmed for your grocery order. We're preparing your items!`
        : `Payment confirmed for your Shop & Ship order. We'll start purchasing your items shortly!`;
    } else {
      body = `Payment failed for your order. Please try again or use a different payment method.`;
    }
    
    try {
      await sendPushNotification(user.push_token, title, body, {
        type: 'payment_update',
        orderType,
        trackingNumber: trackingNumber || undefined,
        success
      });
    } catch (err) {
      logger.error('Failed to send payment notification', { error: err.message });
    }
  };

  switch (event.type) {
    case 'payment_intent.succeeded': {
      logger.info('PaymentIntent succeeded', { paymentIntentId });
      try {
        const result = await findOrderByPaymentIntent(paymentIntentId);
        
        if (!result) {
          logger.warn('No order found for payment intent', { paymentIntentId });
          break;
        }
        
        const { order, type } = result;
        const user = getUserFromOrder(result);
        
        // Update payment status based on order type
        order.payment_status = 'paid';
        if (type === 'shipment') {
          order.paid_at = new Date();
        } else if (type === 'grocery') {
          order.order_status = 'confirmed';
        } else if (type === 'shopship') {
          order.status = 'paid';
          order.status_history.push({ status: 'paid', timestamp: new Date(), note: 'Payment confirmed via Stripe' });
        }
        
        await order.save();
        logger.info(`${type} payment updated`, { orderId: order._id, status: 'paid' });
        
        // Send notification
        const trackingNumber = order.tracking_number || order.order_number;
        await sendPaymentNotification(user, type, trackingNumber, true);
        
      } catch (dbError) {
        logger.error('Failed to update order payment status', { error: dbError.message, paymentIntentId });
      }
      break;
    }
    
    case 'payment_intent.payment_failed': {
      logger.warn('Payment failed', { paymentIntentId });
      try {
        const result = await findOrderByPaymentIntent(paymentIntentId);
        
        if (result) {
          const { order, type } = result;
          const user = getUserFromOrder(result);
          
          if (type === 'shopship') {
            order.payment_status = 'failed';
            order.status_history.push({ status: 'payment_failed', timestamp: new Date(), note: 'Payment failed' });
          } else {
            order.payment_status = 'pending';
          }
          await order.save();
          
          // Notify customer of failure
          await sendPaymentNotification(user, type, null, false);
        }
      } catch (dbError) {
        logger.error('Failed to update order on payment failure', { error: dbError.message });
      }
      break;
    }
    
    case 'payment_intent.canceled': {
      logger.info('PaymentIntent canceled', { paymentIntentId });
      try {
        const result = await findOrderByPaymentIntent(paymentIntentId);
        
        if (result) {
          const { order, type } = result;
          order.payment_status = 'pending';
          if (type === 'shopship') {
            order.status_history.push({ status: 'payment_canceled', timestamp: new Date(), note: 'Payment authorization canceled' });
          }
          await order.save();
          logger.info(`${type} payment authorization canceled`, { orderId: order._id });
        }
      } catch (dbError) {
        logger.error('Failed to update order on payment cancel', { error: dbError.message });
      }
      break;
    }
    
    case 'charge.refunded': {
      logger.info('Charge refunded', { paymentIntentId });
      try {
        const result = await findOrderByPaymentIntent(paymentIntentId);
        
        if (result) {
          const { order, type } = result;
          const user = getUserFromOrder(result);
          
          order.payment_status = 'refunded';
          if (type === 'shopship') {
            order.status = 'refunded';
            order.status_history.push({ status: 'refunded', timestamp: new Date(), note: 'Payment refunded' });
          } else if (type === 'grocery') {
            order.order_status = 'cancelled';
          }
          await order.save();
          logger.info(`${type} refund processed`, { orderId: order._id });
          
          // Notify customer of refund
          if (user?.push_token) {
            await sendPushNotification(user.push_token, '💰 Refund Processed', 
              `Your refund has been processed. It may take 5-10 business days to appear in your account.`,
              { type: 'refund_processed' }
            );
          }
        }
      } catch (dbError) {
        logger.error('Failed to update order refund status', { error: dbError.message });
      }
      break;
    }
    
    case 'charge.dispute.created': {
      logger.error('DISPUTE CREATED - Potential fraud', { paymentIntentId, disputeId: paymentIntent.id });
      try {
        const result = await findOrderByPaymentIntent(paymentIntentId);
        
        if (result) {
          const { order, type } = result;
          // Add dispute flag to order
          order.payment_dispute = true;
          order.payment_notes = `Dispute opened: ${new Date().toISOString()}`;
          await order.save();
          
          // Alert admin (could expand to email/Slack notification)
          logger.error('Payment dispute requires attention', { 
            orderId: order._id, 
            orderType: type,
            amount: paymentIntent.amount 
          });
        }
      } catch (dbError) {
        logger.error('Failed to handle dispute', { error: dbError.message });
      }
      break;
    }
    
    case 'charge.dispute.closed': {
      logger.info('Dispute closed', { paymentIntentId, status: paymentIntent.status });
      try {
        const result = await findOrderByPaymentIntent(paymentIntentId);
        
        if (result) {
          const { order } = result;
          order.payment_dispute = false;
          order.payment_notes = `Dispute closed (${paymentIntent.status}): ${new Date().toISOString()}`;
          await order.save();
        }
      } catch (dbError) {
        logger.error('Failed to handle dispute closure', { error: dbError.message });
      }
      break;
    }
    
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
