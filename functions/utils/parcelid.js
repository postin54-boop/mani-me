// Parcel ID generation logic
function generateParcelId(sequenceNumber) {
  const year = new Date().getFullYear();
  const paddedNumber = String(sequenceNumber).padStart(5, '0');
  const fullId = `MM-UK-${year}-${paddedNumber}`;
  const shortId = `MM${sequenceNumber}`;
  return { parcel_id: fullId, parcel_id_short: shortId };
}

module.exports = { generateParcelId };
