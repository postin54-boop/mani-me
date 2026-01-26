// ======================
// Parcel Controller
// ======================
const Shipment = require('../models/shipment');
const ParcelItem = require('../models/parcelItem');
const { generateParcelId } = require('../utils/idGenerator');

// Get parcel counts per warehouse (summary for admin UI)
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
    console.error('Warehouse summary error:', err);
    res.status(500).json({ message: 'Error fetching warehouse summary', error: err.message });
  }
};

// Get all warehouse parcels (for admin UI)
exports.getWarehouseParcels = async (req, res) => {
  try {
    // Fetch all shipments with warehouse status
    const parcels = await Shipment.find({
      warehouse_status: { $ne: 'not_arrived' }
    })
    .select('parcel_id tracking_number sender_name receiver_name warehouse_status status pickup_address delivery_city delivery_region parcel_size weight_kg createdAt')
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();
    
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
    
    res.json(formatted);
  } catch (err) {
    console.error('Warehouse parcels error:', err);
    res.status(500).json({ message: 'Error fetching warehouse parcels', error: err.message });
  }
};

exports.createParcelItem = async (req, res) => {
  // ...validate input, get booking, etc.
  const { bookingId, itemType, itemLetter } = req.body;
  const id = generateParcelId(bookingId, itemLetter);
  const parcel = new ParcelItem({ ...req.body, id, booking_id: bookingId, item_type: itemType });
  await parcel.save();
  res.status(201).json(parcel);
};

// ...other parcel controller methods
