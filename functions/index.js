const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const QRCode = require("qrcode");

// Initialize Firebase Admin FIRST
initializeApp();
const db = getFirestore();

// Helper to verify authentication
const requireAuth = (context, functionName) => {
  if (!context.auth) {
    throw new HttpsError('unauthenticated', `${functionName} requires authentication`);
  }
  return context.auth.uid;
};

// Generate QR Code
exports.generateQRCode = onCall(async (data, context) => {
  requireAuth(context, 'generateQRCode');
  
  const { parcelId } = data;
  if (!parcelId) throw new HttpsError('invalid-argument', "Missing parcelId");

  const qrData = `parcel:${parcelId}`;
  const qrImage = await QRCode.toDataURL(qrData);

  await db.collection("parcels").doc(parcelId).update({ qrCode: qrImage });

  return { qrCode: qrImage };
});

// Login User (REMOVED - now handled client-side)
// exports.loginUser = onCall(async (data, context) => {
//   return { message: "Login endpoint hit" };
// });

// Register Driver (public - no auth required for registration)
exports.registerDriver = onCall(async (data, context) => {
  const { name, email, phone, vehicle } = data;
  if (!name || !email || !phone || !vehicle)
    throw new HttpsError('invalid-argument', "Missing required fields");

  const driverRef = db.collection("drivers").doc();

  await driverRef.set({
    name,
    email,
    phone,
    vehicle,
    createdAt: new Date().toISOString(),
  });

  return { id: driverRef.id, message: "Driver registered" };
});

// Create Parcel
exports.createParcel = onCall(async (data, context) => {
  const uid = requireAuth(context, 'createParcel');
  
  const { senderId, receiverName, receiverAddress, weight, status } = data;

  // Use authenticated user's ID if senderId not provided
  const actualSenderId = senderId || uid;

  if (!receiverName || !receiverAddress || !weight)
    throw new HttpsError('invalid-argument', "Missing required parcel fields");

  const parcelRef = db.collection("parcels").doc();

  await parcelRef.set({
    senderId: actualSenderId,
    receiverName,
    receiverAddress,
    weight,
    status: status || "pending",
    createdAt: new Date().toISOString(),
    createdBy: uid,
  });

  return { id: parcelRef.id, message: "Parcel created" };
});

// Assign Driver
exports.assignDriver = onCall(async (data, context) => {
  requireAuth(context, 'assignDriver');
  
  const { parcelId, driverId } = data;
  if (!parcelId || !driverId) throw new HttpsError('invalid-argument', "Missing IDs");

  await db.collection("parcels").doc(parcelId).update({
    driverId,
    assignedAt: new Date().toISOString(),
  });

  return { message: "Driver assigned" };
});

// Update Parcel Status
exports.updateParcelStatus = onCall(async (data, context) => {
  requireAuth(context, 'updateParcelStatus');
  
  const { parcelId, status } = data;
  if (!parcelId || !status) throw new HttpsError('invalid-argument', "Missing fields");

  await db.collection("parcels").doc(parcelId).update({
    status,
    statusUpdatedAt: new Date().toISOString(),
  });

  return { message: "Parcel status updated" };
});

// Send Driver Message
exports.sendDriverMessage = onCall(async (data, context) => {
  requireAuth(context, 'sendDriverMessage');
  
  const { driverId, message } = data;
  if (!driverId || !message) throw new HttpsError('invalid-argument', "Missing fields");

  const msgRef = db
    .collection("drivers")
    .doc(driverId)
    .collection("messages")
    .doc();

  await msgRef.set({
    message,
    sentAt: new Date().toISOString(),
    sentBy: context.auth.uid,
  });

  return { id: msgRef.id, message: "Message sent" };
});

// Scan Parcel
exports.scanParcel = onCall(async (data, context) => {
  const uid = requireAuth(context, 'scanParcel');
  
  const { parcelId, scannedBy } = data;
  if (!parcelId) throw new HttpsError('invalid-argument', "Missing parcelId");

  const scanRef = db
    .collection("parcels")
    .doc(parcelId)
    .collection("scans")
    .doc();

  await scanRef.set({
    scannedBy: scannedBy || uid,
    scannedAt: new Date().toISOString(),
  });

  return { id: scanRef.id, message: "Parcel scanned" };
});

// Order History
exports.getOrderHistory = onCall(async (data, context) => {
  const uid = requireAuth(context, 'getOrderHistory');
  
  // Only allow users to see their own orders
  const snap = await db
    .collection("parcels")
    .where("senderId", "==", uid)
    .get();

  const orders = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { orders };
});
