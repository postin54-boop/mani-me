// QR code generation logic
const QRCode = require('qrcode');

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

module.exports = { generateQRCodeData, generateQRCodeImage };
