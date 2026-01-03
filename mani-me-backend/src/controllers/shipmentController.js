// src/controllers/shipmentController.js
const Shipment = require('../models/shipment');

exports.getShipmentStats = async (req, res) => {
  const { userId } = req.params;
  console.log("USER ID:", userId); // Debug log
  try {
    const total = await Shipment.countDocuments({ userId });
    const delivered = await Shipment.countDocuments({ userId, status: "delivered" });
    const pending = await Shipment.countDocuments({ userId, status: "pending" });
    res.json({ total, delivered, pending });
  } catch (error) {
    console.error("Stats error:", error);
    res.status(500).json({ message: "Failed to fetch stats" });
  }
};
