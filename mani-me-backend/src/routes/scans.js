const express = require('express');
const router = express.Router();
const { Shipment, Item, User } = require('../models');

// Bulk scan upload endpoint
// Accepts: [{ parcel_id, driver_id, event_type, timestamp }]
router.post('/bulk', async (req, res) => {
  try {
    const { scans } = req.body;
    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ error: 'No scan events provided' });
    }
    // For demo: just log and return success
    // In production: store in DB, update shipment/item status, trigger notifications, etc.
    for (const scan of scans) {
      // Validate required fields
      if (!scan.parcel_id || !scan.driver_id || !scan.event_type || !scan.timestamp) {
        return res.status(400).json({ error: 'Missing scan event fields' });
      }
      // Optionally: update shipment/item status here
      // Example: if (scan.event_type === 'picked_up') ...
    }
    res.json({ message: 'Scan events received', count: scans.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
