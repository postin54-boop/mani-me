/**
 * @fileoverview Controller for Apple Wallet pass generation and status.
 * Extracted from routes/wallet.js inline handlers.
 */

const Shipment = require('../models/shipment');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { PKPass } = require('passkit-generator');
const logger = require('../utils/logger');

// Pass Type ID and Team ID - set these in environment variables
const PASS_TYPE_ID = process.env.APPLE_PASS_TYPE_ID || 'pass.com.manime.shipment';
const TEAM_ID = process.env.APPLE_TEAM_ID || '9669F2K8HP';
const WEB_SERVICE_URL = process.env.API_URL || 'https://mani-me.onrender.com';

// Certificate paths
const CERTS_DIR = path.join(__dirname, '..', '..', 'certs');
const MODEL_DIR = path.join(__dirname, '..', '..', 'assets', 'wallet', 'manime.pass');

/**
 * Load certificates for pass signing.
 * Tries to load from files first, then falls back to environment variables (base64 encoded).
 * 
 * File paths (local dev):
 *   - mani-me-backend/certs/wwdr.pem
 *   - mani-me-backend/certs/signerCert.pem
 *   - mani-me-backend/certs/signerKey.pem
 * 
 * Environment variables (production/Render):
 *   - APPLE_WWDR_CERT_BASE64
 *   - APPLE_SIGNER_CERT_BASE64
 *   - APPLE_SIGNER_KEY_BASE64
 * 
 * @returns {object|null} Certificate buffers or null if missing
 */
const loadCertificates = () => {
  const wwdrPath = path.join(CERTS_DIR, 'wwdr.pem');
  const signerCertPath = path.join(CERTS_DIR, 'signerCert.pem');
  const signerKeyPath = path.join(CERTS_DIR, 'signerKey.pem');

  // Try loading from files first (local development)
  if (fs.existsSync(wwdrPath) && fs.existsSync(signerCertPath) && fs.existsSync(signerKeyPath)) {
    logger.info('Loading Apple Wallet certificates from files');
    return {
      wwdr: fs.readFileSync(wwdrPath),
      signerCert: fs.readFileSync(signerCertPath),
      signerKey: fs.readFileSync(signerKeyPath),
      signerKeyPassphrase: process.env.APPLE_PASS_CERTIFICATE_PASSWORD || '',
    };
  }

  // Try loading from environment variables (production/Render)
  const wwdrBase64 = process.env.APPLE_WWDR_CERT_BASE64;
  const signerCertBase64 = process.env.APPLE_SIGNER_CERT_BASE64;
  const signerKeyBase64 = process.env.APPLE_SIGNER_KEY_BASE64;

  // Debug: log what we're getting from env vars
  logger.info('Checking Apple Wallet env vars', {
    wwdrExists: !!wwdrBase64,
    wwdrLength: wwdrBase64?.length || 0,
    signerCertExists: !!signerCertBase64,
    signerCertLength: signerCertBase64?.length || 0,
    signerKeyExists: !!signerKeyBase64,
    signerKeyLength: signerKeyBase64?.length || 0,
  });

  if (wwdrBase64 && signerCertBase64 && signerKeyBase64) {
    logger.info('Loading Apple Wallet certificates from environment variables');
    return {
      wwdr: Buffer.from(wwdrBase64, 'base64'),
      signerCert: Buffer.from(signerCertBase64, 'base64'),
      signerKey: Buffer.from(signerKeyBase64, 'base64'),
      signerKeyPassphrase: process.env.APPLE_PASS_CERTIFICATE_PASSWORD || '',
    };
  }

  logger.warn('Apple Wallet certificates not found (neither files nor env vars)');
  return null;
};

/**
 * Format shipment status for display on a wallet pass.
 * @param {string} status - Raw shipment status
 * @returns {string} Human-readable status
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
 * Generate and return a signed .pkpass file for a shipment.
 * @route GET /api/wallet/pass/:shipmentId
 */
const generatePass = async (req, res) => {
  try {
    const { shipmentId } = req.params;

    // Find shipment
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    // Check if user owns this shipment
    const userIdFromToken = req.userId || req.user?.user_id || req.user?.id;
    if (shipment.userId && shipment.userId !== 'guest' && shipment.userId !== userIdFromToken?.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to shipment' });
    }

    // Load certificates
    const certs = loadCertificates();
    if (!certs) {
      logger.error('Apple Wallet certificates not found in %s', CERTS_DIR);
      return res.status(503).json({
        error: 'Apple Wallet is not available yet. Coming soon!',
        code: 'WALLET_NOT_CONFIGURED',
      });
    }

    // Create pass from the model folder
    const pass = await PKPass.from(
      {
        model: MODEL_DIR,
        certificates: certs,
      },
      {
        serialNumber: shipment.tracking_number || shipmentId,
        passTypeIdentifier: PASS_TYPE_ID,
        teamIdentifier: TEAM_ID,
        organizationName: 'Mani Me',
        description: 'Shipment Tracking Pass',
        logoText: 'Mani Me',
        foregroundColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgb(11, 26, 51)',
        labelColor: 'rgb(131, 197, 250)',
        webServiceURL: WEB_SERVICE_URL,
        authenticationToken: crypto.randomBytes(16).toString('hex'),
      }
    );

    // Set barcode
    pass.setBarcodes({
      format: 'PKBarcodeFormatQR',
      message: shipment.tracking_number || shipmentId,
      messageEncoding: 'iso-8859-1',
      altText: shipment.tracking_number || shipmentId,
    });

    // Set relevance
    pass.setRelevantDate(new Date());

    // Primary fields
    pass.primaryFields.push({
      key: 'tracking',
      label: 'TRACKING NUMBER',
      value: shipment.tracking_number || 'N/A',
    });

    // Secondary fields
    pass.secondaryFields.push(
      {
        key: 'status',
        label: 'STATUS',
        value: formatStatus(shipment.status),
      },
      {
        key: 'destination',
        label: 'DESTINATION',
        value: shipment.delivery_city || 'Ghana',
      }
    );

    // Auxiliary fields
    pass.auxiliaryFields.push(
      {
        key: 'sender',
        label: 'FROM',
        value: shipment.sender_name || 'N/A',
      },
      {
        key: 'receiver',
        label: 'TO',
        value: shipment.receiver_name || 'N/A',
      }
    );

    // Back fields (details visible when user flips the pass)
    pass.backFields.push(
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
        value: [shipment.pickup_address, shipment.pickup_city, shipment.pickup_postcode].filter(Boolean).join(', ') || 'N/A',
      },
      {
        key: 'deliveryAddress',
        label: 'Delivery Address',
        value: [shipment.delivery_address, shipment.delivery_city, shipment.delivery_region].filter(Boolean).join(', ') || 'N/A',
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
      }
    );

    // Generate the .pkpass buffer
    const buffer = pass.getAsBuffer();

    // Send as .pkpass file
    res.set({
      'Content-Type': 'application/vnd.apple.pkpass',
      'Content-Disposition': `attachment; filename=${shipment.tracking_number || shipmentId}.pkpass`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (error) {
    logger.error('Error generating wallet pass: %s', error.message);
    logger.error('Stack trace: %s', error.stack);
    res.status(500).json({ 
      error: 'Failed to generate wallet pass',
      details: error.message,
    });
  }
};

/**
 * Get current status for pass updates (used by Apple's pass update service).
 * @route GET /api/wallet/pass/:serialNumber/status
 */
const getPassStatus = async (req, res) => {
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
    logger.error('Error getting pass status: %o', error);
    res.status(500).json({ error: 'Failed to get pass status' });
  }
};

/**
 * Health check endpoint to verify certificate loading.
 * @param {express.Request} req
 * @param {express.Response} res
 */
const healthCheck = async (req, res) => {
  const certs = loadCertificates();
  
  if (certs) {
    res.json({
      status: 'ok',
      certificates: 'loaded',
      teamId: TEAM_ID,
      passTypeId: PASS_TYPE_ID,
    });
  } else {
    res.status(503).json({
      status: 'error',
      certificates: 'not found',
      message: 'Apple Wallet certificates not configured',
    });
  }
};

module.exports = {
  generatePass,
  getPassStatus,
  healthCheck,
};
