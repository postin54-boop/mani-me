// Driver assignment logic
async function assignDriver(db, parcelId, driverId) {
  await db.collection('parcels').doc(parcelId).update({ driver_id: driverId });
  return true;
}

module.exports = { assignDriver };
