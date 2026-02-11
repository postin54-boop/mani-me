const express = require('express');
const router = express.Router();
const GroceryItem = require('../models/groceryItem');
const GroceryOrder = require('../models/groceryOrder');
const Settings = require('../models/settings');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Get all grocery items (public)
router.get('/items', async (req, res) => {
  try {
    const { category } = req.query;
    const query = { is_available: true };
    
    if (category && ['grocery', 'electronics', 'household'].includes(category)) {
      query.category = category;
    }
    
    const items = await GroceryItem.find(query).sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching grocery items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Get single item
router.get('/items/:id', async (req, res) => {
  try {
    const item = await GroceryItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    res.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ message: 'Failed to fetch item' });
  }
});

// Calculate shipping cost
router.post('/calculate-shipping', verifyToken, async (req, res) => {
  try {
    const { country, subtotal, itemCount, boxSize } = req.body;
    
    // Both Ghana and UK residents pay shipping based on box size
    // Box sizes: small (£30), medium (£45), large (£50)
    let shipping_cost = 0;
    
    if (boxSize) {
      // If box size is provided explicitly
      const boxPricing = {
        small: 30,
        medium: 45,
        large: 50
      };
      shipping_cost = boxPricing[boxSize] || 30;
    } else if (itemCount) {
      // Auto-calculate box size based on item count
      if (itemCount <= 5) {
        shipping_cost = 30; // Small box
      } else if (itemCount <= 10) {
        shipping_cost = 45; // Medium box
      } else {
        shipping_cost = 50; // Large box
      }
    } else {
      // Default to small box
      shipping_cost = 30;
    }
    
    return res.json({ 
      shipping_cost,
      box_size: shipping_cost === 30 ? 'small' : shipping_cost === 45 ? 'medium' : 'large'
    });
  } catch (error) {
    console.error('Error calculating shipping:', error);
    res.status(500).json({ message: 'Failed to calculate shipping' });
  }
});

// Create order
router.post('/orders', verifyToken, async (req, res) => {
  try {
    const { items, subtotal, shipping_cost, delivery_address } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }
    
    if (!delivery_address || !delivery_address.country) {
      return res.status(400).json({ message: 'Delivery address required' });
    }
    
    // Verify stock availability
    for (const orderItem of items) {
      const item = await GroceryItem.findById(orderItem.item_id);
      if (!item) {
        return res.status(404).json({ message: `Item ${orderItem.name} not found` });
      }
      if (item.stock < orderItem.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
    }
    
    const total_amount = subtotal + shipping_cost;
    
    const order = new GroceryOrder({
      user_id: req.userId,
      items,
      subtotal,
      shipping_cost,
      total_amount,
      delivery_address,
      order_status: 'pending',
      payment_status: 'pending'
    });
    
    await order.save();
    
    // Reduce stock
    for (const orderItem of items) {
      await GroceryItem.findByIdAndUpdate(
        orderItem.item_id,
        { $inc: { stock: -orderItem.quantity } }
      );
    }
    
    res.status(201).json(order);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Update order payment status (after payment)
router.put('/orders/:id/payment', verifyToken, async (req, res) => {
  try {
    const { payment_intent_id } = req.body;
    const order = await GroceryOrder.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.user_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    order.payment_status = 'paid';
    order.payment_intent_id = payment_intent_id;
    order.order_status = 'confirmed';
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Error updating payment:', error);
    res.status(500).json({ message: 'Failed to update payment' });
  }
});

// Get user's orders
router.get('/orders', verifyToken, async (req, res) => {
  try {
    const orders = await GroceryOrder.find({ user_id: req.userId })
      .sort({ createdAt: -1 })
      .populate('items.item_id', 'name image_url');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Get single order
router.get('/orders/:id', verifyToken, async (req, res) => {
  try {
    const order = await GroceryOrder.findById(req.params.id)
      .populate('items.item_id', 'name image_url');
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    if (order.user_id.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
});

// ============ ADMIN ROUTES ============

// Get all items (including unavailable) - Admin only
router.get('/admin/items', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const items = await GroceryItem.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ message: 'Failed to fetch items' });
  }
});

// Create item - Admin only
router.post('/admin/items', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const item = new GroceryItem({
      ...req.body,
      created_by: req.userId
    });
    await item.save();
    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: 'Failed to create item' });
  }
});

// Update item - Admin only
router.put('/admin/items/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const item = await GroceryItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Failed to update item' });
  }
});

// Delete item - Admin only
router.delete('/admin/items/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const item = await GroceryItem.findByIdAndDelete(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Failed to delete item' });
  }
});

// Get all orders - Admin only
router.get('/admin/orders', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const orders = await GroceryOrder.find()
      .sort({ createdAt: -1 })
      .populate('user_id', 'name email phone')
      .populate('items.item_id', 'name image_url');
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
});

// Update order - Admin only
router.put('/admin/orders/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const order = await GroceryOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Failed to update order' });
  }
});

module.exports = router;
