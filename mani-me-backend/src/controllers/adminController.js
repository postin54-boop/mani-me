/**
 * Admin Controller
 * Handles HTTP request/response for admin operations
 * @module controllers/adminController
 */

const { user: User, shipment: Shipment } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { authenticator } = require('otplib');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { escapeRegex } = require('../utils/sanitize');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  try {
    const { email, password, totpCode } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }
    
    // Fetch user with 2FA secret if needed
    const adminUser = await User.findOne({ email, role: 'ADMIN' }).select('+twoFactorSecret +twoFactorBackupCodes');
    if (!adminUser) {
      logger.warn('Failed admin login attempt', { email, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      logger.warn('Failed admin password', { email, ip: req.ip });
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check if 2FA is enabled
    if (adminUser.twoFactorEnabled) {
      if (!totpCode) {
        // Return that 2FA is required (don't issue token yet)
        return res.status(200).json({ 
          requires2FA: true, 
          message: '2FA code required',
          adminId: adminUser.id 
        });
      }
      
      // Verify TOTP code
      const isValidTotp = authenticator.verify({ token: totpCode, secret: adminUser.twoFactorSecret });
      
      // Check backup codes if TOTP fails
      let usedBackupCode = false;
      if (!isValidTotp && adminUser.twoFactorBackupCodes?.length > 0) {
        const backupIndex = adminUser.twoFactorBackupCodes.indexOf(totpCode);
        if (backupIndex !== -1) {
          // Remove used backup code
          adminUser.twoFactorBackupCodes.splice(backupIndex, 1);
          await adminUser.save();
          usedBackupCode = true;
          logger.warn('Admin used backup code', { email, ip: req.ip });
        }
      }
      
      if (!isValidTotp && !usedBackupCode) {
        logger.warn('Failed admin 2FA verification', { email, ip: req.ip });
        return res.status(401).json({ message: 'Invalid 2FA code' });
      }
    }
    
    const token = jwt.sign(
      { user_id: adminUser.id, email: adminUser.email, isAdmin: true, role: 'ADMIN' },
      JWT_SECRET,
      { expiresIn: '2h' }
    );
    logger.info('Admin login successful', { email, ip: req.ip, twoFactorUsed: adminUser.twoFactorEnabled });
    res.json({
      token,
      message: 'Login successful',
      adminId: adminUser.id,
      admin: { id: adminUser.id, email: adminUser.email, fullName: adminUser.fullName, twoFactorEnabled: adminUser.twoFactorEnabled }
    });
  } catch (error) {
    logger.error('Admin login error', { error: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// ========================================
// TWO-FACTOR AUTHENTICATION (2FA)
// ========================================

/**
 * Generate 2FA setup (secret + QR code)
 * Admin must be logged in to enable 2FA
 */
exports.setup2FA = async (req, res) => {
  try {
    const userId = req.admin?.user_id || req.userId;
    const adminUser = await User.findById(userId);
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    if (adminUser.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }
    
    // Generate secret
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(adminUser.email, 'ManiMe Admin', secret);
    
    // Generate QR code as data URL
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    
    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    
    // Store secret temporarily (not enabled yet until verified)
    adminUser.twoFactorSecret = secret;
    adminUser.twoFactorBackupCodes = backupCodes;
    await adminUser.save();
    
    logger.info('2FA setup initiated', { adminId: userId });
    
    res.json({
      message: 'Scan QR code with your authenticator app',
      qrCode: qrCodeUrl,
      secret: secret, // Manual entry option
      backupCodes: backupCodes // Show once, user must save these
    });
  } catch (error) {
    logger.error('2FA setup error', { error: error.message });
    res.status(500).json({ message: 'Failed to setup 2FA' });
  }
};

/**
 * Verify and enable 2FA
 * User must provide a valid TOTP code to confirm setup
 */
exports.verify2FA = async (req, res) => {
  try {
    const { totpCode } = req.body;
    const userId = req.admin?.user_id || req.userId;
    
    if (!totpCode) {
      return res.status(400).json({ message: 'TOTP code required' });
    }
    
    const adminUser = await User.findById(userId).select('+twoFactorSecret');
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    if (!adminUser.twoFactorSecret) {
      return res.status(400).json({ message: 'Please setup 2FA first' });
    }
    
    if (adminUser.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is already enabled' });
    }
    
    // Verify the TOTP code
    const isValid = authenticator.verify({ token: totpCode, secret: adminUser.twoFactorSecret });
    
    if (!isValid) {
      logger.warn('Invalid 2FA verification attempt', { adminId: userId });
      return res.status(400).json({ message: 'Invalid code. Please try again.' });
    }
    
    // Enable 2FA
    adminUser.twoFactorEnabled = true;
    await adminUser.save();
    
    logger.info('2FA enabled successfully', { adminId: userId });
    
    res.json({ 
      message: '2FA enabled successfully',
      twoFactorEnabled: true
    });
  } catch (error) {
    logger.error('2FA verification error', { error: error.message });
    res.status(500).json({ message: 'Failed to verify 2FA' });
  }
};

/**
 * Disable 2FA (requires current TOTP code or backup code)
 */
exports.disable2FA = async (req, res) => {
  try {
    const { totpCode, password } = req.body;
    const userId = req.admin?.user_id || req.userId;
    
    if (!totpCode || !password) {
      return res.status(400).json({ message: 'Password and TOTP code required' });
    }
    
    const adminUser = await User.findById(userId).select('+twoFactorSecret +twoFactorBackupCodes');
    
    if (!adminUser || adminUser.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    if (!adminUser.twoFactorEnabled) {
      return res.status(400).json({ message: '2FA is not enabled' });
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid password' });
    }
    
    // Verify TOTP code
    const isValidTotp = authenticator.verify({ token: totpCode, secret: adminUser.twoFactorSecret });
    const isBackupCode = adminUser.twoFactorBackupCodes?.includes(totpCode);
    
    if (!isValidTotp && !isBackupCode) {
      return res.status(400).json({ message: 'Invalid 2FA code' });
    }
    
    // Disable 2FA
    adminUser.twoFactorEnabled = false;
    adminUser.twoFactorSecret = undefined;
    adminUser.twoFactorBackupCodes = [];
    await adminUser.save();
    
    logger.info('2FA disabled', { adminId: userId });
    
    res.json({ 
      message: '2FA disabled successfully',
      twoFactorEnabled: false
    });
  } catch (error) {
    logger.error('2FA disable error', { error: error.message });
    res.status(500).json({ message: 'Failed to disable 2FA' });
  }
};

/**
 * Get 2FA status
 */
exports.get2FAStatus = async (req, res) => {
  try {
    const userId = req.admin?.user_id || req.userId;
    const adminUser = await User.findById(userId);
    
    if (!adminUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ 
      twoFactorEnabled: adminUser.twoFactorEnabled || false
    });
  } catch (error) {
    logger.error('Get 2FA status error', { error: error.message });
    res.status(500).json({ message: 'Failed to get 2FA status' });
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
