/**
 * Promo Code Controller
 * @module controllers/promoCodeController
 */

const PromoCode = require('../models/promoCode');
const logger = require('../utils/logger');

/**
 * Get all promo codes (admin only) with pagination and optional status filter.
 */
exports.getAll = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    const status = req.query.status;

    let query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const [promoCodes, total] = await Promise.all([
      PromoCode.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PromoCode.countDocuments(query)
    ]);

    res.json({
      promoCodes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching promo codes', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch promo codes' });
  }
};

/**
 * Get a single promo code by ID.
 */
exports.getById = async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    res.json(promoCode);
  } catch (error) {
    logger.error('Error fetching promo code', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to fetch promo code' });
  }
};

/**
 * Create a new promo code (admin only).
 */
exports.create = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      description,
      expiryDate,
      usageLimit,
      minOrderValue,
      maxDiscount,
      applicableTo,
      status
    } = req.body;

    if (!code || !type || value === undefined || !expiryDate || !usageLimit) {
      return res.status(400).json({
        error: 'Missing required fields: code, type, value, expiryDate, usageLimit'
      });
    }

    const existing = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existing) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }

    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      type,
      value,
      description: description || '',
      expiryDate: new Date(expiryDate),
      usageLimit,
      minOrderValue: minOrderValue || 0,
      maxDiscount: maxDiscount || null,
      applicableTo: applicableTo || 'all',
      status: status || 'active',
      createdBy: req.userId
    });

    await promoCode.save();
    res.status(201).json(promoCode);
  } catch (error) {
    logger.error('Error creating promo code', { error: error.message, code: req.body.code });
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Promo code already exists' });
    }
    res.status(500).json({ error: 'Failed to create promo code' });
  }
};

/**
 * Update an existing promo code (admin only).
 */
exports.update = async (req, res) => {
  try {
    const {
      code,
      type,
      value,
      description,
      expiryDate,
      usageLimit,
      minOrderValue,
      maxDiscount,
      applicableTo,
      status
    } = req.body;

    const promoCode = await PromoCode.findById(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    // Check if new code conflicts with existing
    if (code && code.toUpperCase() !== promoCode.code) {
      const existing = await PromoCode.findOne({ code: code.toUpperCase() });
      if (existing) {
        return res.status(400).json({ error: 'Promo code already exists' });
      }
      promoCode.code = code.toUpperCase();
    }

    if (type) promoCode.type = type;
    if (value !== undefined) promoCode.value = value;
    if (description !== undefined) promoCode.description = description;
    if (expiryDate) promoCode.expiryDate = new Date(expiryDate);
    if (usageLimit) promoCode.usageLimit = usageLimit;
    if (minOrderValue !== undefined) promoCode.minOrderValue = minOrderValue;
    if (maxDiscount !== undefined) promoCode.maxDiscount = maxDiscount;
    if (applicableTo) promoCode.applicableTo = applicableTo;
    if (status) promoCode.status = status;

    await promoCode.save();
    res.json(promoCode);
  } catch (error) {
    logger.error('Error updating promo code', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to update promo code' });
  }
};

/**
 * Delete a promo code (admin only).
 */
exports.delete = async (req, res) => {
  try {
    const promoCode = await PromoCode.findByIdAndDelete(req.params.id);
    if (!promoCode) {
      return res.status(404).json({ error: 'Promo code not found' });
    }
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    logger.error('Error deleting promo code', { error: error.message, id: req.params.id });
    res.status(500).json({ error: 'Failed to delete promo code' });
  }
};

/**
 * Validate a promo code (public, rate-limited).
 */
exports.validate = async (req, res) => {
  try {
    const { code, orderValue, orderType } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, message: 'Promo code is required' });
    }

    const promo = await PromoCode.findOne({
      code: code.toUpperCase(),
      status: 'active'
    });

    if (!promo) {
      return res.status(404).json({ valid: false, message: 'Invalid promo code' });
    }

    // Check expiry
    if (new Date(promo.expiryDate) < new Date()) {
      promo.status = 'expired';
      await promo.save();
      return res.status(400).json({ valid: false, message: 'Promo code has expired' });
    }

    // Check usage limit
    if (promo.usedCount >= promo.usageLimit) {
      return res.status(400).json({ valid: false, message: 'Promo code usage limit reached' });
    }

    // Check applicability
    if (promo.applicableTo !== 'all' && orderType && promo.applicableTo !== orderType) {
      return res.status(400).json({
        valid: false,
        message: `This promo code is only valid for ${promo.applicableTo} orders`
      });
    }

    // Check minimum order value
    if (orderValue && orderValue < promo.minOrderValue) {
      return res.status(400).json({
        valid: false,
        message: `Minimum order value of £${promo.minOrderValue} required`
      });
    }

    // Calculate discount
    let discount = 0;
    if (orderValue) {
      if (promo.type === 'percentage') {
        discount = orderValue * (promo.value / 100);
        if (promo.maxDiscount && discount > promo.maxDiscount) {
          discount = promo.maxDiscount;
        }
      } else {
        discount = promo.value;
      }
    }

    return res.json({
      valid: true,
      promo: {
        id: promo._id,
        code: promo.code,
        type: promo.type,
        value: promo.value,
        description: promo.description,
        minOrderValue: promo.minOrderValue,
        maxDiscount: promo.maxDiscount
      },
      discount: Math.round(discount * 100) / 100
    });
  } catch (error) {
    logger.error('Error validating promo code', { error: error.message, code: req.body.code });
    res.status(500).json({ valid: false, message: 'Failed to validate promo code' });
  }
};

/**
 * Apply a promo code – increments usage count (authenticated).
 * Uses atomic $inc to prevent race conditions.
 */
exports.apply = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    // Use atomic findOneAndUpdate with $inc to prevent race conditions
    // Only increment if usedCount < usageLimit (enforces limit atomically)
    const promo = await PromoCode.findOneAndUpdate(
      {
        code: code.toUpperCase(),
        status: 'active',
        $expr: { $lt: ['$usedCount', '$usageLimit'] }
      },
      { $inc: { usedCount: 1 } },
      { new: true }
    );

    if (!promo) {
      // Check if code exists but is at limit
      const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
      if (!existingCode) {
        return res.status(404).json({ error: 'Invalid promo code' });
      }
      if (existingCode.status !== 'active') {
        return res.status(400).json({ error: 'Promo code is no longer active' });
      }
      if (existingCode.usedCount >= existingCode.usageLimit) {
        return res.status(400).json({ error: 'Promo code usage limit reached' });
      }
      return res.status(404).json({ error: 'Invalid promo code' });
    }

    res.json({ message: 'Promo code applied successfully', usedCount: promo.usedCount });
  } catch (error) {
    logger.error('Error applying promo code', { error: error.message, code: req.body.code });
    res.status(500).json({ error: 'Failed to apply promo code' });
  }
};

/**
 * Get promo code stats overview (admin only).
 */
exports.getStats = async (req, res) => {
  try {
    const [total, active, expired, totalUsage] = await Promise.all([
      PromoCode.countDocuments(),
      PromoCode.countDocuments({ status: 'active' }),
      PromoCode.countDocuments({ status: 'expired' }),
      PromoCode.aggregate([
        { $group: { _id: null, totalUsed: { $sum: '$usedCount' } } }
      ])
    ]);

    res.json({
      total,
      active,
      expired,
      inactive: total - active - expired,
      totalUsage: totalUsage.length > 0 ? totalUsage[0].totalUsed : 0
    });
  } catch (error) {
    logger.error('Error fetching promo stats', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch promo stats' });
  }
};
