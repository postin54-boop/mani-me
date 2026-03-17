/**
 * @fileoverview Controller for QR/barcode scan operations.
 * Extracted from routes/scans.js inline handlers.
 */

const logger = require('../utils/logger');
const Shipment = require('../models/shipment');
const TrackingEvent = require('../models/trackingEvent');
const User = require('../models/user');
const { sendShipmentStatusNotification } = require('../services/notificationService');

const EVENT_STATUS_MAP = {
  pickup_scanned: { status: 'picked_up', warehouse_status: 'received' },
  picked_up: { status: 'picked_up', warehouse_status: 'received' },
  parcel_collected: { status: 'picked_up', warehouse_status: 'received' },
  warehouse_received: { status: 'at_uk_warehouse', warehouse_status: 'received' },
  sorted: { status: 'processing', warehouse_status: 'sorted' },
  packed: { status: 'processing', warehouse_status: 'packed' },
  shipped: { status: 'departed_uk', warehouse_status: 'shipped' },
  in_transit: { status: 'in_transit' },
  customs: { status: 'customs' },
  out_for_delivery: { status: 'out_for_delivery' },
  delivered: { status: 'delivered' },
};

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

    const processed = [];
    const failed = [];

    for (const scan of scans) {
      if (!scan.parcel_id || !scan.driver_id || !scan.event_type || !scan.timestamp) {
        failed.push({
          parcel_id: scan.parcel_id || null,
          reason: 'Missing scan event fields',
        });
        continue;
      }

      const eventTime = new Date(scan.timestamp);
      if (Number.isNaN(eventTime.getTime())) {
        failed.push({
          parcel_id: scan.parcel_id,
          reason: 'Invalid timestamp',
        });
        continue;
      }

      const shipment = await Shipment.findOne({
        $or: [
          { parcel_id: scan.parcel_id },
          { parcel_id_short: scan.parcel_id },
          { tracking_number: scan.parcel_id },
        ],
      });

      if (!shipment) {
        failed.push({
          parcel_id: scan.parcel_id,
          reason: 'Shipment not found',
        });
        continue;
      }

      await TrackingEvent.create({
        parcel_id: shipment.parcel_id || scan.parcel_id,
        status: scan.event_type,
        timestamp: eventTime,
        actor: scan.driver_id,
        notes: scan.notes || '',
      });

      const mapped = EVENT_STATUS_MAP[scan.event_type];
      if (mapped) {
        if (mapped.status) {
          shipment.status = mapped.status;
          shipment.shipment_status = mapped.status;

          const timestampField = `${mapped.status}_at`;
          if (Object.prototype.hasOwnProperty.call(shipment.toObject(), timestampField)) {
            shipment[timestampField] = eventTime;
          }
        }

        if (mapped.warehouse_status) {
          shipment.warehouse_status = mapped.warehouse_status;
        }

        await shipment.save();

        if (shipment.userId && mapped.status) {
          const user = await User.findById(shipment.userId).select('push_token');
          if (user?.push_token) {
            try {
              await sendShipmentStatusNotification(user.push_token, shipment.tracking_number, mapped.status);
            } catch (notifError) {
              logger.error('Failed to send shipment scan notification', {
                error: notifError.message,
                parcel_id: shipment.parcel_id,
              });
            }
          }
        }
      }

      processed.push({
        parcel_id: shipment.parcel_id || scan.parcel_id,
        event_type: scan.event_type,
        mapped_status: mapped?.status || null,
      });
    }

    res.json({
      message: 'Scan batch processed',
      count: scans.length,
      processed_count: processed.length,
      failed_count: failed.length,
      processed,
      failed,
    });
  } catch (error) {
    logger.error('Error processing bulk scans', { error: error.message });
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  bulkScan,
};
