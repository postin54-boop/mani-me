const express = require('express');
const router = express.Router();
const { User, Shipment } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const ADMIN_EMAIL = 'admin@manime.com';
const ADMIN_PASSWORD = 'admin123'; // Change this in production!

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Simple admin check (in production, use database)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, isAdmin: true },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({ token, message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const totalOrders = await Shipment.count();
    const totalUsers = await User.count();
    
    const paidOrders = await Shipment.findAll({
      where: { payment_status: 'paid' }
    });
    
    const totalRevenue = paidOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.price) || 0);
    }, 0);

    const pendingOrders = await Shipment.count({
      where: { status: 'pending' }
    });

    res.json({
      totalOrders,
      totalUsers,
      totalRevenue,
      pendingOrders,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all orders
router.get('/orders', verifyAdmin, async (req, res) => {
  try {
    const orders = await Shipment.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update order status
router.put('/orders/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Shipment.findByPk(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    await order.update({ status });
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      order: [['createdAt', 'DESC']],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user status
router.put('/users/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.update({ is_active });
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
