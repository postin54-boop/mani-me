/**
 * Apple Wallet Routes
 * Generates .pkpass files for shipment tracking
 */

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Shipment = require('../models/shipment');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Pass Type ID and Team ID - set these in environment variables
const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID || 'pass.com.manime.shipment';
const TEAM_ID = process.env.APPLE_TEAM_ID || 'YOUR_TEAM_ID';
const WEB_SERVICE_URL = process.env.API_URL || 'https://mani-me.onrender.com';

/**
 * Generate pass.json content for a shipment
 */
const generatePassJson = (shipment) => {
  const passJson = {
    formatVersion: 1,
    passTypeIdentifier: PASS_TYPE_ID,
    teamIdentifier: TEAM_ID,
    serialNumber: shipment.tracking_number,
    webServiceURL: WEB_SERVICE_URL,
    authenticationToken: crypto.randomBytes(16).toString('hex'),
    organizationName: 'Mani Me',
    description: 'Shipment Tracking Pass',
    logoText: 'Mani Me',
    foregroundColor: 'rgb(255, 255, 255)',
    backgroundColor: 'rgb(11, 26, 51)', // Navy blue
    labelColor: 'rgb(131, 197, 250)', // Sky blue
    
    // Barcode for scanning
    barcodes: [
      {
        format: 'PKBarcodeFormatQR',
        message: shipment.tracking_number,
        messageEncoding: 'iso-8859-1',
        altText: shipment.tracking_number,
      },
    ],
    
    // Pass structure - using generic pass type
    generic: {
      primaryFields: [
        {
          key: 'tracking',
          label: 'TRACKING NUMBER',
          value: shipment.tracking_number,
        },
      ],
      secondaryFields: [
        {
          key: 'status',
          label: 'STATUS',
          value: formatStatus(shipment.status),
        },
        {
          key: 'destination',
          label: 'DESTINATION',
          value: shipment.delivery_city || 'Ghana',
        },
      ],
      auxiliaryFields: [
        {
          key: 'sender',
          label: 'FROM',
          value: shipment.sender_name || 'N/A',
        },
        {
          key: 'receiver',
          label: 'TO',
          value: shipment.receiver_name || 'N/A',
        },
      ],
      backFields: [
        {
          key: 'parcelId',
          label: 'Parcel ID',
          value: shipment.parcel_id || shipment.parcel_id_short || 'N/A',
        },
        {
          key: 'weight',
          label: 'Weight',
          value: `${shipment.weight_kg || 0} kg`,
        },
        {
          key: 'pickupAddress',
          label: 'Pickup Address',
          value: `${shipment.pickup_address || ''}, ${shipment.pickup_city || ''}, ${shipment.pickup_postcode || ''}`,
        },
        {
          key: 'deliveryAddress',
          label: 'Delivery Address',
          value: `${shipment.delivery_address || ''}, ${shipment.delivery_city || ''}, ${shipment.delivery_region || ''}`,
        },
        {
          key: 'receiverPhone',
          label: 'Receiver Phone',
          value: shipment.receiver_phone || 'N/A',
        },
        {
          key: 'trackingUrl',
          label: 'Track Online',
          value: `${WEB_SERVICE_URL}/track/${shipment.tracking_number}`,
        },
      ],
    },
    
    // Relevance - show notification when status changes
    relevantDate: new Date().toISOString(),
  };

  return passJson;
};

/**
 * Format status for display
 */
const formatStatus = (status) => {
  const statusMap = {
    booked: 'Booked',
    pending_pickup: 'Pending Pickup',
    driver_assigned: 'Driver Assigned',
    driver_en_route: 'Driver En Route',
    picked_up: 'Picked Up',
    at_uk_warehouse: 'At UK Warehouse',
    processing: 'Processing',
    departed_uk: 'Departed UK',
    in_transit: 'In Transit',
    arrived_ghana: 'Arrived Ghana',
    customs: 'In Customs',
    customs_cleared: 'Customs Cleared',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    on_hold: 'On Hold',
    returned: 'Returned',
  };
  return statusMap[status] || status || 'Unknown';
};

/**
 * GET /api/wallet/pass/:shipmentId
 * Generate and return a .pkpass file for a shipment
 * 
 * Note: In production, you need:
 * 1. Apple Developer Certificate for Pass Type ID
 * 2. Signing the pass with the certificate
 * 3. Proper pass assets (icon.png, logo.png, etc.)
 * 
 * For now, this returns the pass.json structure
 * Full implementation requires signing with Apple certificates
 */
router.get('/pass/:shipmentId', verifyToken, async (req, res) => {
  try {
    const { shipmentId } = req.params;
    
    // Find shipment
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Check if user owns this shipment
    if (shipment.userId !== req.user.user_id && shipment.userId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access to shipment' });
    }

    // Generate pass JSON
    const passJson = generatePassJson(shipment);

    // In production, you would:
    // 1. Create a temp directory
    // 2. Add pass.json
    // 3. Add icon.png, icon@2x.png, logo.png, logo@2x.png
    // 4. Generate manifest.json with SHA1 hashes
    // 5. Sign with your Apple certificate to create signature
    // 6. Zip everything into a .pkpass file
    // 7. Return the .pkpass file

    // For development, return the pass structure as JSON
    // The frontend can use this to display pass info
    res.json({
      message: 'Pass data generated',
      pass: passJson,
      note: 'Full .pkpass generation requires Apple Developer certificates. See APPLE_WALLET_SETUP.md for instructions.',
    });

  } catch (error) {
    console.error('Error generating wallet pass:', error);
    res.status(500).json({ error: 'Failed to generate wallet pass' });
  }
});

/**
 * GET /api/wallet/pass/:shipmentId/status
 * Get current status for pass updates (used by Apple's pass update service)
 */
router.get('/pass/:serialNumber/status', async (req, res) => {
  try {
    const { serialNumber } = req.params;
    
    const shipment = await Shipment.findOne({ tracking_number: serialNumber });
    if (!shipment) {
      return res.status(404).json({ error: 'Pass not found' });
    }

    res.json({
      status: formatStatus(shipment.status),
      lastUpdated: shipment.updatedAt,
    });

  } catch (error) {
    console.error('Error getting pass status:', error);
    res.status(500).json({ error: 'Failed to get pass status' });
  }
});

module.exports = router;
