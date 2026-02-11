const QRCode = require('qrcode');

/**
 * Generate unique parcel IDs
 * Format: MM-UK-2025-00482 (full) and MM482 (short)
 */
function generateParcelId(sequenceNumber) {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  
  const fullId = `MM-UK-${year}-${paddedNumber}`;
  const shortId = `MM${sequenceNumber}`;
  
  return {
    parcel_id: fullId,
    parcel_id_short: shortId
  };
}

/**
 * Generate QR code data for a parcel
 * Layer 2: QR Code containing all essential information
 */
function generateQRCodeData(shipmentData) {
  return JSON.stringify({
    parcel_id: shipmentData.parcel_id,
    parcel_id_short: shipmentData.parcel_id_short,
    customer_id: shipmentData.user_id,
    customer_name: shipmentData.sender_name,
    customer_phone: shipmentData.sender_phone,
    receiver_name: shipmentData.receiver_name,
    receiver_phone: shipmentData.receiver_phone,
    parcel_type: shipmentData.parcel_description || 'General',
    parcel_size: shipmentData.parcel_size,
    weight_kg: shipmentData.weight_kg,
    pickup_location: `${shipmentData.pickup_city}, ${shipmentData.pickup_postcode}`,
    destination: shipmentData.ghana_destination || shipmentData.delivery_city,
    tracking_number: shipmentData.tracking_number,
    booked_at: shipmentData.booked_at,
    status: shipmentData.status
  });
}

/**
 * Generate QR code image as data URL
 */
async function generateQRCodeImage(qrCodeData) {
  try {
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

/**
 * Determine parcel size based on weight and dimensions
 */
function determineParcelSize(weight_kg, dimensions) {
  if (weight_kg <= 5) return 'small';
  if (weight_kg <= 15) return 'medium';
  if (weight_kg <= 30) return 'large';
  return 'extra_large';
}

/**
 * Get next sequence number for parcel ID
 * Uses Mongoose to query the database for the last parcel number
 */
async function getNextSequenceNumber(ShipmentModel) {
  try {
    // Query for the highest parcel_id_short number using Mongoose
    const lastShipment = await ShipmentModel.findOne({ parcel_id_short: { $exists: true } })
      .sort({ createdAt: -1 })
      .select('parcel_id_short')
      .lean();
    
    if (lastShipment && lastShipment.parcel_id_short) {
      // Extract number from "MM482" format
      const lastShortId = lastShipment.parcel_id_short;
      const lastNumber = parseInt(lastShortId.replace('MM', ''));
      if (!isNaN(lastNumber)) {
        return lastNumber + 1;
      }
    }
    
    return 1; // Start from 1 if no parcels exist
  } catch (error) {
    console.error('Error getting sequence number:', error);
    // Fallback: use count of all shipments + 1
    try {
      const count = await ShipmentModel.countDocuments();
      return count + 1;
    } catch {
      return Math.floor(Math.random() * 10000); // Last resort fallback
    }
  }
}

module.exports = {
  generateParcelId,
  generateQRCodeData,
  generateQRCodeImage,
  determineParcelSize,
  getNextSequenceNumber
};
