// Parcel creation and tracking logic for Firebase Functions
const { v4: uuidv4 } = require('uuid');
const { generateParcelId, generateQRCodeData, generateQRCodeImage, determineParcelSize } = require('./qrcode');

// Create a new parcel (Firestore version)
async function createParcel(db, data) {
  // Validate required fields (add more as needed)
  const required = ['sender_name','sender_phone','sender_email','pickup_address','pickup_city','pickup_postcode','receiver_name','receiver_phone','delivery_address','delivery_city','delivery_region','weight_kg'];
  for (const field of required) {
    if (!data[field]) throw new Error(`Missing required field: ${field}`);
  }

  // Calculate cost (simple pricing: £5 base + £2 per kg)
  const total_cost = 5 + (data.weight_kg * 2);

  // Generate unique parcel IDs (sequenceNumber logic can be improved for Firestore)
  const sequenceNumber = Math.floor(Math.random() * 100000); // TODO: Replace with Firestore counter
  const { parcel_id, parcel_id_short } = generateParcelId(sequenceNumber);

  // Determine parcel size
  const parcel_size = determineParcelSize(data.weight_kg, data.dimensions);

  // Prepare Firestore document
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

  // Generate QR code data and image
  const qrCodeData = generateQRCodeData({ ...shipmentData, tracking_number: shipmentData.tracking_number });
  const qrCodeUrl = await generateQRCodeImage(qrCodeData);

  shipmentData.qr_code_data = qrCodeData;
  shipmentData.qr_code_url = qrCodeUrl;

  // Save to Firestore
  const ref = await db.collection('parcels').add(shipmentData);
  return { ...shipmentData, id: ref.id };
}

// Update parcel status (Firestore version)
async function updateParcelStatus(db, parcelId, status) {
  const ref = db.collection('parcels').doc(parcelId);
  await ref.update({ status, [`${status}_at`]: new Date().toISOString() });
  return (await ref.get()).data();
}

module.exports = { createParcel, updateParcelStatus };
