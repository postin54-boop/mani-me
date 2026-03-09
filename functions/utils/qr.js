// QR code generation logic
const QRCode = require('qrcode');

// Website base URL for tracking
const TRACKING_BASE_URL = 'https://maniime.com/track';

function generateQRCodeData(shipmentData) {
  // Generate a tracking URL instead of raw JSON
  // This URL will be scannable and redirect to the tracking page
  const trackingNumber = shipmentData.tracking_number || shipmentData.parcel_id_short;
  return `${TRACKING_BASE_URL}/${trackingNumber}`;
}

// Generate full JSON data for internal use (stored separately)
function generateQRCodeMetadata(shipmentData) {
  return JSON.stringify({
    parcel_id: shipmentData.parcel_id,
    parcel_id_short: shipmentData.parcel_id_short,
    tracking_number: shipmentData.tracking_number,
    parcel_type: shipmentData.parcel_description || 'General',
    parcel_size: shipmentData.parcel_size,
    weight_kg: shipmentData.weight_kg,
    pickup_location: `${shipmentData.pickup_city}, ${shipmentData.pickup_postcode}`,
    destination: shipmentData.ghana_destination || shipmentData.delivery_city,
    booked_at: shipmentData.booked_at,
    status: shipmentData.status
  });
}

async function generateQRCodeImage(qrCodeData) {
  try {
    const qrCodeUrl = await QRCode.toDataURL(qrCodeData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' }
    });
    return qrCodeUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return null;
  }
}

module.exports = { generateQRCodeData, generateQRCodeImage, generateQRCodeMetadata };
