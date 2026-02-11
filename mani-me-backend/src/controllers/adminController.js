/**
 * Admin Controller
 * Handles HTTP request/response for admin operations
 * @module controllers/adminController
 */

const { user: User, shipment: Shipment } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { escapeRegex } = require('../utils/sanitize');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    const adminUser = await User.findOne({ email, role: 'ADMIN' });
    if (!adminUser) {
      logger.warn('Failed admin login attempt', { email, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      logger.warn('Failed admin password', { email, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign(
      { user_id: adminUser.id, email: adminUser.email, isAdmin: true, role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    logger.info('Admin login successful', { email, ip: req.ip });
    res.json({
      token,
      message: 'Login successful',
      adminId: adminUser.id,
      admin: { id: adminUser.id, email: adminUser.email, fullName: adminUser.fullName }
    });
  } catch (error) {
    logger.error('Admin login error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.verify = async (req, res) => {
  try {
    res.json({
      valid: true,
      message: 'Token is valid',
      admin: {
        id: req.admin.user_id || req.admin.id,
        email: req.admin.email,
        role: req.admin.role
      }
    });
  } catch (error) {
    logger.error('Token verification error', { error: error.message });
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
};

exports.getDashboard = async (req, res) => {
  try {
    const [totalOrders, totalUsers, revenueResult, pendingOrders] = await Promise.all([
      Shipment.countDocuments(),
      User.countDocuments(),
      Shipment.aggregate([
        { $match: { payment_status: 'paid' } },
        { $group: { _id: null, totalRevenue: { $sum: { $ifNull: ['$total_cost', 0] } } } }
      ]),
      Shipment.countDocuments({ status: 'pending' })
    ]);
    const totalRevenue = revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    res.json({ totalOrders, totalUsers, totalRevenue, pendingOrders });
  } catch (error) {
    logger.error('Dashboard error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { status, search } = req.query;
    let query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { tracking_number: { $regex: safeSearch, $options: 'i' } },
        { sender_name: { $regex: safeSearch, $options: 'i' } },
        { receiver_name: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    const [ordersRaw, total] = await Promise.all([
      Shipment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Shipment.countDocuments(query)
    ]);
    const orders = ordersRaw.map(order => ({ ...order, id: order._id.toString() }));
    res.json({ orders, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Get orders error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const order = await Shipment.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    logger.error('Update order status error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const { search, role } = req.query;
    let query = {};
    if (role && role !== 'all') query.role = role;
    if (search) {
      const safeSearch = escapeRegex(search);
      query.$or = [
        { email: { $regex: safeSearch, $options: 'i' } },
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { phone: { $regex: safeSearch, $options: 'i' } }
      ];
    }
    const [users, total] = await Promise.all([
      User.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(query)
    ]);
    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    logger.error('Get users error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { is_active: req.body.is_active }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User status updated', user });
  } catch (error) {
    logger.error('Update user status error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getUkDrivers = async (req, res) => {
  try {
    const drivers = await User.find({
      $or: [
        { role: 'DRIVER', driver_type: 'UK' },
        { role: 'UK_DRIVER' },
        { role: 'DRIVER', driver_type: 'pickup' }
      ]
    }).select('-password').sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    logger.error('Get UK drivers error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getGhanaDrivers = async (req, res) => {
  try {
    const drivers = await User.find({
      $or: [
        { role: 'DRIVER', driver_type: 'Ghana' },
        { role: 'GH_DRIVER' },
        { role: 'DRIVER', driver_type: 'delivery' }
      ]
    }).select('-password').sort({ createdAt: -1 });
    res.json(drivers);
  } catch (error) {
    logger.error('Get Ghana drivers error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingPickups = async (req, res) => {
  try {
    const pendingPickups = await Shipment.find({
      status: 'booked',
      pickup_driver_id: null
    }).populate('userId', 'id fullName email phone').sort({ pickup_date: 1, pickup_time: 1 });
    res.json(pendingPickups);
  } catch (error) {
    logger.error('Get pending pickups error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getAssignedPickups = async (req, res) => {
  try {
    const assignedPickups = await Shipment.find({
      status: { $in: ['booked', 'picked_up'] },
      pickup_driver_id: { $ne: null }
    }).populate('userId', 'id fullName email phone')
      .populate('pickup_driver_id', 'id fullName phone')
      .sort({ updatedAt: -1 });
    res.json(assignedPickups);
  } catch (error) {
    logger.error('Get assigned pickups error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getPendingDeliveries = async (req, res) => {
  try {
    const pendingDeliveries = await Shipment.find({
      status: 'customs',
      warehouse_status: 'cleared',
      delivery_driver_id: null
    }).populate('userId', 'id fullName email phone').sort({ updatedAt: 1 });
    res.json(pendingDeliveries);
  } catch (error) {
    logger.error('Get pending deliveries error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignPickupDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    if (!driver_id) {
      shipment.pickup_driver_id = null;
      await shipment.save();
      return res.json({ message: 'Pickup driver unassigned successfully', shipment });
    }

    const driver = await User.findOne({
      _id: driver_id,
      $or: [
        { role: 'DRIVER', driver_type: 'UK' },
        { role: 'UK_DRIVER' },
        { role: 'DRIVER', driver_type: 'pickup' }
      ]
    });
    if (!driver) return res.status(404).json({ message: 'UK driver not found' });

    shipment.pickup_driver_id = driver_id;
    await shipment.save();

    if (driver.push_token) {
      try {
        const { sendPickupAssignedNotification } = require('../services/notificationService');
        await sendPickupAssignedNotification(driver.push_token, shipment, driver);
      } catch (notifError) {
        logger.error('Failed to send pickup notification', { error: notifError.message });
      }
    }
    res.json({ message: 'Pickup driver assigned successfully', shipment });
  } catch (error) {
    logger.error('Assign pickup driver error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

exports.assignDeliveryDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) return res.status(404).json({ message: 'Shipment not found' });

    if (!driver_id) {
      shipment.delivery_driver_id = null;
      await shipment.save();
      return res.json({ message: 'Delivery driver unassigned successfully', shipment });
    }

    const driver = await User.findOne({
      _id: driver_id,
      $or: [
        { role: 'DRIVER', driver_type: 'Ghana' },
        { role: 'GH_DRIVER' },
        { role: 'DRIVER', driver_type: 'delivery' }
      ]
    });
    if (!driver) return res.status(404).json({ message: 'Ghana driver not found' });

    shipment.delivery_driver_id = driver_id;
    shipment.status = 'out_for_delivery';
    await shipment.save();

    if (driver.push_token) {
      try {
        const { sendDeliveryAssignedNotification } = require('../services/notificationService');
        await sendDeliveryAssignedNotification(driver.push_token, shipment, driver);
      } catch (notifError) {
        logger.error('Failed to send delivery notification', { error: notifError.message });
      }
    }
    res.json({ message: 'Delivery driver assigned successfully', shipment });
  } catch (error) {
    logger.error('Assign delivery driver error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};
