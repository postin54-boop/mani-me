// Tracking update logic
async function updateParcelStatus(db, parcelId, status) {
  const ref = db.collection('parcels').doc(parcelId);
  await ref.update({ status, [`${status}_at`]: new Date().toISOString() });
  return (await ref.get()).data();
}

module.exports = { updateParcelStatus };
