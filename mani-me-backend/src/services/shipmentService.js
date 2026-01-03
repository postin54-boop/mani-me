const { Shipment, Driver } = require('../models');

exports.assignDriver = async (shipmentId, driverId, type) => {
  // type: 'pickup' or 'delivery'
  // Use Mongoose findById instead of Sequelize findByPk
  const shipment = await Shipment.findById(shipmentId);
  if (!shipment) return null;
  const driver = await Driver.findById(driverId);
  if (!driver) throw new Error('Driver not found');
  if (type === 'pickup') {
    shipment.pickup_driver_id = driverId;
  } else if (type === 'delivery') {
    shipment.delivery_driver_id = driverId;
  }
  await shipment.save();
  return shipment;
};
