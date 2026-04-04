/**
 * Grocery Controller
 * @module controllers/groceryController
 */

const mongoose = require('mongoose');
const GroceryItem = require('../models/groceryItem');
const GroceryOrder = require('../models/groceryOrder');
const User = require('../models/user');
const { sendOrderReceiptEmail } = require('../utils/email');
const logger = require('../utils/logger');
const stripe = require('../utils/stripe');

// Public
exports.getItems = async (req, res) => {
  try {
    const { category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const skip = (page - 1) * limit;
    const query = { is_available: true };
    if (category && ['Grocery', 'Electronics', 'Household'].includes(category)) {
      query.category = category;
    }
    const [items, total] = await Promise.all([
      GroceryItem.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      GroceryItem.countDocuments(query)
    ]);
    res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Error fetching grocery items', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch items' });
  }
};

exports.getItem = async (req, res) => {
  try {
    const item = await GroceryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json(item);
  } catch (error) {
    logger.error('Error fetching item', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch item' });
  }
};

exports.calculateShipping = async (req, res) => {
  try {
    const { itemCount, boxSize } = req.body;
    let shipping_cost = 0;
    if (boxSize) {
      const boxPricing = { small: 30, medium: 45, large: 50 };
      shipping_cost = boxPricing[boxSize] || 30;
    } else if (itemCount) {
      if (itemCount <= 5) shipping_cost = 30;
      else if (itemCount <= 10) shipping_cost = 45;
      else shipping_cost = 50;
    } else {
      shipping_cost = 30;
    }
    res.json({ shipping_cost, box_size: shipping_cost === 30 ? 'small' : shipping_cost === 45 ? 'medium' : 'large' });
  } catch (error) {
    logger.error('Error calculating shipping', { error: error.message });
    res.status(500).json({ message: 'Failed to calculate shipping' });
  }
};

exports.createOrder = async (req, res) => {
  // Use MongoDB transaction to prevent race conditions with stock deduction
  const session = await mongoose.startSession();
  
  try {
    const { items, subtotal, shipping_cost, delivery_address } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in order' });
    if (!delivery_address || !delivery_address.country) return res.status(400).json({ message: 'Delivery address required' });

    const total_amount = subtotal + shipping_cost;
    let order;
    
    await session.withTransaction(async () => {
      // Deduct stock atomically within transaction
      for (const orderItem of items) {
        const result = await GroceryItem.findOneAndUpdate(
          { _id: orderItem.item_id, stock: { $gte: orderItem.quantity } },
          { $inc: { stock: -orderItem.quantity } },
          { new: true, session }
        );
        if (!result) {
          const item = await GroceryItem.findById(orderItem.item_id).session(session);
          if (!item) {
            throw new Error(`Item ${orderItem.name || orderItem.item_id} not found`);
          }
          throw new Error(`Insufficient stock for ${item.name}`);
        }
      }

      // Create order within same transaction
      const newOrder = new GroceryOrder({ 
        user_id: req.userId, 
        items, 
        subtotal, 
        shipping_cost, 
        total_amount, 
        delivery_address, 
        order_status: 'pending', 
        payment_status: 'pending' 
      });
      await newOrder.save({ session });
      order = newOrder;
    });

    await session.endSession();

    // Send order receipt email to customer (non-blocking)
    try {
      const user = await User.findById(req.userId);
      if (user && user.email) {
        const emailItems = items.map(item => ({
          name: item.name || 'Grocery Item',
          quantity: item.quantity || 1,
          price: item.price || 0,
        }));
        
        sendOrderReceiptEmail({
          email: user.email,
          name: user.fullName || user.name || 'Customer',
          orderType: 'Grocery',
          orderId: order._id.toString(),
          items: emailItems,
          total: total_amount,
        })
          .then(() => logger.info('Grocery order receipt email sent', { orderId: order._id }))
          .catch((err) => logger.error('Failed to send grocery order receipt email', { error: err.message }));
      }
    } catch (emailError) {
      logger.error('Error sending grocery order email', { error: emailError.message });
    }

    res.status(201).json(order);
  } catch (error) {
    await session.endSession();
    // Handle specific error types
    if (error.message.includes('Insufficient stock')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ message: error.message });
    }
    logger.error('Error creating order', { error: error.message });
    res.status(500).json({ message: 'Failed to create order' });
  }
};

exports.updateOrderPayment = async (req, res) => {
  try {
    const { payment_intent_id } = req.body;
    if (!payment_intent_id) {
      return res.status(400).json({ message: 'Payment intent ID required' });
    }
    
    const order = await GroceryOrder.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user_id.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });
    
    // SECURITY: Verify payment with Stripe before marking as paid
    const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    if (paymentIntent.status !== 'succeeded') {
      logger.warn('Payment verification failed', { 
        orderId: order._id, 
        paymentIntentId: payment_intent_id,
        stripeStatus: paymentIntent.status 
      });
      return res.status(400).json({ 
        message: 'Payment not completed', 
        stripeStatus: paymentIntent.status 
      });
    }
    
    // Verify amount matches (prevent amount manipulation)
    const expectedAmountCents = Math.round(order.total_amount * 100);
    if (paymentIntent.amount !== expectedAmountCents) {
      logger.warn('Payment amount mismatch', {
        orderId: order._id,
        expected: expectedAmountCents,
        received: paymentIntent.amount
      });
      return res.status(400).json({ message: 'Payment amount mismatch' });
    }
    
    order.payment_status = 'paid';
    order.payment_intent_id = payment_intent_id;
    order.order_status = 'confirmed';
    await order.save();
    
    logger.info('Order payment verified and confirmed', { orderId: order._id });
    res.json(order);
  } catch (error) {
    if (error.type === 'StripeInvalidRequestError') {
      logger.warn('Invalid payment intent', { error: error.message });
      return res.status(400).json({ message: 'Invalid payment intent' });
    }
    logger.error('Error updating payment', { error: error.message });
    res.status(500).json({ message: 'Failed to update payment' });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const orders = await GroceryOrder.find({ user_id: req.userId }).sort({ createdAt: -1 }).populate('items.item_id', 'name image_url');
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

exports.getUserOrder = async (req, res) => {
  try {
    const order = await GroceryOrder.findById(req.params.id).populate('items.item_id', 'name image_url');
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.user_id.toString() !== req.userId) return res.status(403).json({ message: 'Unauthorized' });
    res.json(order);
  } catch (error) {
    logger.error('Error fetching order', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

// Admin
exports.adminGetItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    let query = {};
    if (req.query.search) query.name = { $regex: req.query.search, $options: 'i' };
    if (req.query.category) query.category = req.query.category;
    const [items, total] = await Promise.all([
      GroceryItem.find(query).sort({ category: 1, name: 1 }).skip(skip).limit(limit),
      GroceryItem.countDocuments(query)
    ]);
    res.json({ items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Error fetching items (admin)', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch items' });
  }
};

exports.adminCreateItem = async (req, res) => {
  try {
    const item = new GroceryItem({ ...req.body, created_by: req.userId });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    logger.error('Error creating item', { error: error.message, body: req.body });
    res.status(500).json({ message: error.message || 'Failed to create item' });
  }
};

exports.adminUpdateItem = async (req, res) => {
  try {
    logger.info('Updating grocery item', { id: req.params.id, body: req.body });
    const item = await GroceryItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ message: 'Item not found' });
    logger.info('Item updated successfully', { id: item._id, image_url: item.image_url });
    res.json(item);
  } catch (error) {
    logger.error('Error updating item', { error: error.message, body: req.body });
    res.status(500).json({ message: 'Failed to update item' });
  }
};

exports.adminDeleteItem = async (req, res) => {
  try {
    const item = await GroceryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    logger.error('Error deleting item', { error: error.message });
    res.status(500).json({ message: 'Failed to delete item' });
  }
};

exports.adminGetOrders = async (req, res) => {
  try {
    const orders = await GroceryOrder.find().sort({ createdAt: -1 }).populate('user_id', 'name email phone').populate('items.item_id', 'name image_url');
    res.json(orders);
  } catch (error) {
    logger.error('Error fetching orders (admin)', { error: error.message });
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

exports.adminUpdateOrder = async (req, res) => {
  try {
    const order = await GroceryOrder.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (error) {
    logger.error('Error updating order', { error: error.message });
    res.status(500).json({ message: 'Failed to update order' });
  }
};
