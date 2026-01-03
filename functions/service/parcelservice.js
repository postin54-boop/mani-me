// Parcel service logic
const { v4: uuidv4 } = require('uuid');
const { generateParcelId } = require('../utils/parcelid');
const { generateQRCodeData, generateQRCodeImage } = require('../utils/qr');
const { determineParcelSize } = require('../modules/qrcode');

async function createParcel(db, data) {
  const required = ['sender_name','sender_phone','sender_email','pickup_address','pickup_city','pickup_postcode','receiver_name','receiver_phone','delivery_address','delivery_city','delivery_region','weight_kg'];
  for (const field of required) {
    if (!data[field]) throw new Error(`Missing required field: ${field}`);
  }
  const total_cost = 5 + (data.weight_kg * 2);
  const sequenceNumber = Math.floor(Math.random() * 100000); // TODO: Replace with Firestore counter
  const { parcel_id, parcel_id_short } = generateParcelId(sequenceNumber);
  const parcel_size = determineParcelSize(data.weight_kg, data.dimensions);
  const shipmentData = {
    id: uuidv4(),
    ...data,
    parcel_id,
    parcel_id_short,
    parcel_size,
    total_cost,
    status: 'booked',
    booked_at: new Date().toISOString(),
  };
  const qrCodeData = generateQRCodeData({ ...shipmentData, tracking_number: shipmentData.tracking_number });
  const qrCodeUrl = await generateQRCodeImage(qrCodeData);
  shipmentData.qr_code_data = qrCodeData;
  shipmentData.qr_code_url = qrCodeUrl;
  const ref = await db.collection('parcels').add(shipmentData);
  return { ...shipmentData, id: ref.id };
}

module.exports = { createParcel };
