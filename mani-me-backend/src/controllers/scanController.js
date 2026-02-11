/**
 * @fileoverview Controller for QR/barcode scan operations.
 * Extracted from routes/scans.js inline handlers.
 */

const logger = require('../utils/logger');

/**
 * Process a bulk batch of scan events.
 * @route POST /api/scans/bulk
 */
const bulkScan = async (req, res) => {
  try {
    const { scans } = req.body;
    if (!Array.isArray(scans) || scans.length === 0) {
      return res.status(400).json({ error: 'No scan events provided' });
    }

    // Validate each scan event
    for (const scan of scans) {
      if (!scan.parcel_id || !scan.driver_id || !scan.event_type || !scan.timestamp) {
        return res.status(400).json({ error: 'Missing scan event fields' });
      }
      // TODO: store in DB, update shipment/item status, trigger notifications
    }

    res.json({ message: 'Scan events received', count: scans.length });
  } catch (error) {
    logger.error('Error processing bulk scans: %o', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  bulkScan,
};
