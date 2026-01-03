// QR code and parcel ID logic for Firebase Functions
const QRCode = require('qrcode');

function generateParcelId(sequenceNumber) {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  const fullId = `MM-UK-${year}-${paddedNumber}`;
  const shortId = `MM${sequenceNumber}`;
  return { parcel_id: fullId, parcel_id_short: shortId };
}

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

function determineParcelSize(weight_kg, dimensions) {
  if (weight_kg <= 5) return 'small';
  if (weight_kg <= 15) return 'medium';
  if (weight_kg <= 30) return 'large';
  return 'extra_large';
}

module.exports = { generateParcelId, generateQRCodeData, generateQRCodeImage, determineParcelSize };
