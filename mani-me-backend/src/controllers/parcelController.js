/**
 * Parcel Controller
 * Handles warehouse and parcel-related operations
 * @module controllers/parcelController
 */

const Shipment = require('../models/shipment');
const ParcelItem = require('../models/parcelItem');
const { generateParcelId } = require('../utils/idGenerator');
const logger = require('../utils/logger');

/**
 * Get parcel counts per warehouse (summary for admin UI)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getWarehouseSummary = async (req, res) => {
  try {
    
    // Count shipments by warehouse_status
    const summary = await Shipment.aggregate([
      {
        $match: {
          warehouse_status: { $in: ['received', 'sorted', 'packed'] }
        }
      },
      {
        $group: {
          _id: "$warehouse_status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Count UK warehouse (parcels picked up but not yet shipped to Ghana)
    const ukCount = await Shipment.countDocuments({
      warehouse_status: { $in: ['received', 'sorted', 'packed'] }
    });
    
    // Count Ghana warehouse (parcels shipped and in transit/customs)
    const ghanaCount = await Shipment.countDocuments({
      status: { $in: ['customs', 'out_for_delivery'] },
      warehouse_status: 'shipped'
    });
    
    res.json({ UK: ukCount, Ghana: ghanaCount });
  } catch (err) {
    logger.error('Warehouse summary error', { error: err.message });
    res.status(500).json({ message: 'Error fetching warehouse summary', error: err.message });
  }
};

/**
 * Get all warehouse parcels (for admin UI)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.getWarehouseParcels = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const baseQuery = { warehouse_status: { $ne: 'not_arrived' } };

    const [parcels, total] = await Promise.all([
      Shipment.find(baseQuery)
        .select('parcel_id tracking_number sender_name receiver_name warehouse_status status pickup_address delivery_city delivery_region parcel_size weight_kg createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Shipment.countDocuments(baseQuery)
    ]);
    
    // Format for frontend
    const formatted = parcels.map(p => ({
      id: p.parcel_id || p.tracking_number,
      warehouseLocation: ['received', 'sorted', 'packed'].includes(p.warehouse_status) ? 'UK' : 'Ghana',
      status: p.warehouse_status === 'shipped' ? 'in-transit' : p.warehouse_status === 'received' ? 'in-stock' : p.warehouse_status,
      size: p.parcel_size,
      weight: p.weight_kg,
      sender: p.sender_name,
      receiver: p.receiver_name,
      destination: p.delivery_city,
      tracking_number: p.tracking_number,
      warehouse_status: p.warehouse_status,
      shipment_status: p.status,
      createdAt: p.createdAt
    }));
    
    res.json({
      parcels: formatted,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) }
    });
  } catch (err) {
    logger.error('Warehouse parcels error', { error: err.message });
    res.status(500).json({ message: 'Error fetching warehouse parcels', error: err.message });
  }
};

/**
 * Create a new parcel item
 * @param {Object} req - Express request object
 * @param {Object} req.body - Parcel item data
 * @param {string} req.body.bookingId - Associated booking ID
 * @param {string} req.body.itemType - Type of item
 * @param {string} req.body.itemLetter - Item letter identifier
 * @param {Object} res - Express response object
 * @returns {Promise<void>}
 */
exports.createParcelItem = async (req, res) => {
  try {
    const { bookingId, itemType, itemLetter } = req.body;
    if (!bookingId || !itemType) {
      return res.status(400).json({ error: 'bookingId and itemType are required' });
    }
    const id = generateParcelId(bookingId, itemLetter);
    const parcel = new ParcelItem({ ...req.body, id, booking_id: bookingId, item_type: itemType });
    await parcel.save();
    res.status(201).json(parcel);
  } catch (error) {
    logger.error('Error creating parcel item:', { error: error.message });
    res.status(500).json({ error: 'Failed to create parcel item' });
  }
};

// ...other parcel controller methods
