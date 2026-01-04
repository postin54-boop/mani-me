const express = require('express');
const router = express.Router();
const { user: User, shipment: Shipment } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET environment variable not set. Generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
}

// Admin login rate limiter - stricter than user login (10 attempts per 15 minutes)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts (increased for development)
  message: 'Too many admin login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  handler: (req, res) => {
    console.warn('⚠️  Admin login rate limit exceeded:', req.ip);
    res.status(429).json({
      message: 'Too many admin login attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Middleware to verify admin token
const verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if user has admin privileges
    if (!decoded.isAdmin && decoded.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Set user info for downstream middleware
    req.admin = decoded;
    req.userId = decoded.user_id || decoded.id || decoded.userId;
    next();
  } catch (error) {
    console.error('Admin token verification error:', error.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Admin login - check database for admin users (with rate limiting)
router.post('/login', adminLoginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Find admin user in database (Mongoose syntax)
    const adminUser = await User.findOne({ email, role: 'ADMIN' });

    if (!adminUser) {
      console.warn('⚠️  Failed admin login attempt:', email, 'from IP:', req.ip);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Compare password with bcrypt
    const isValidPassword = await bcrypt.compare(password, adminUser.password);
    
    if (!isValidPassword) {
      console.warn('⚠️  Failed admin password for:', email, 'from IP:', req.ip);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Security: Reduce token expiry from 24h to 2h for admin accounts
    const token = jwt.sign(
      { 
        user_id: adminUser.id,
        email: adminUser.email, 
        isAdmin: true,
        role: 'ADMIN'
      },
      JWT_SECRET,
      { expiresIn: '2h' } // Reduced from 24h for security
    );

    console.log('✅ Admin login successful:', email, 'from IP:', req.ip);

    res.json({ 
      token, 
      message: 'Login successful', 
      adminId: adminUser.id,
      admin: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.fullName
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get dashboard statistics
router.get('/dashboard', verifyAdmin, async (req, res) => {
  try {
    const totalOrders = await Shipment.countDocuments();
    const totalUsers = await User.countDocuments();
    
    const paidOrders = await Shipment.find({ payment_status: 'paid' });
    
    const totalRevenue = paidOrders.reduce((sum, order) => {
      return sum + (parseFloat(order.price) || 0);
    }, 0);

    const pendingOrders = await Shipment.countDocuments({ status: 'pending' });

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
    const orders = await Shipment.find().sort({ createdAt: -1 });
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

    const order = await Shipment.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order status updated', order });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all users
router.get('/users', verifyAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
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

    const user = await User.findByIdAndUpdate(id, { is_active }, { new: true });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User status updated', user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get UK drivers (pickup drivers)
router.get('/drivers/uk', verifyAdmin, async (req, res) => {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Ghana drivers (delivery drivers)
router.get('/drivers/ghana', verifyAdmin, async (req, res) => {
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
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending pickups (shipments needing UK driver assignment)
router.get('/pickups/pending', verifyAdmin, async (req, res) => {
  try {
    const pendingPickups = await Shipment.find({
      status: 'booked',
      pickup_driver_id: null
    }).populate('userId', 'id fullName email phone').sort({ pickup_date: 1, pickup_time: 1 });
    res.json(pendingPickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assigned pickups (for UK drivers)
router.get('/pickups/assigned', verifyAdmin, async (req, res) => {
  try {
    const assignedPickups = await Shipment.find({
      status: { $in: ['booked', 'picked_up'] },
      pickup_driver_id: { $ne: null }
    }).populate('userId', 'id fullName email phone')
      .populate('pickup_driver_id', 'id fullName phone')
      .sort({ updatedAt: -1 });
    res.json(assignedPickups);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get pending deliveries (shipments in Ghana needing driver assignment)
router.get('/deliveries/pending', verifyAdmin, async (req, res) => {
  try {
    const pendingDeliveries = await Shipment.find({
      status: 'customs',
      warehouse_status: 'cleared',
      delivery_driver_id: null
    }).populate('userId', 'id fullName email phone').sort({ updatedAt: 1 });
    res.json(pendingDeliveries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign pickup driver (UK)
router.put('/shipments/:id/assign-pickup-driver', verifyAdmin, async (req, res) => {
  try {
    const { driver_id } = req.body;
    
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Allow unassignment by setting driver_id to null
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

    if (!driver) {
      return res.status(404).json({ message: 'UK driver not found' });
    }

    shipment.pickup_driver_id = driver_id;
    await shipment.save();

    // Send notification to driver
    if (driver.push_token) {
      try {
        const { sendPickupAssignedNotification } = require('../services/notificationService');
        await sendPickupAssignedNotification(driver.push_token, shipment, driver);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    res.json({ 
      message: 'Pickup driver assigned successfully', 
      shipment 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Assign delivery driver (Ghana)
router.put('/shipments/:id/assign-delivery-driver', verifyAdmin, async (req, res) => {
  try {
    const { driver_id } = req.body;
    
    const shipment = await Shipment.findById(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Allow unassignment by setting driver_id to null
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

    if (!driver) {
      return res.status(404).json({ message: 'Ghana driver not found' });
    }

    shipment.delivery_driver_id = driver_id;
    shipment.status = 'out_for_delivery';
    await shipment.save();

    // Send notification to driver
    if (driver.push_token) {
      try {
        const { sendDeliveryAssignedNotification } = require('../services/notificationService');
        await sendDeliveryAssignedNotification(driver.push_token, shipment, driver);
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
    }

    res.json({ 
      message: 'Delivery driver assigned successfully', 
      shipment 
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
