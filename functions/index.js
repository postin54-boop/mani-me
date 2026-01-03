const { onCall } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const QRCode = require("qrcode");

// Initialize Firebase Admin FIRST
initializeApp();
const db = getFirestore();

// Generate QR Code
exports.generateQRCode = onCall(async (data, context) => {
  const { parcelId } = data;
  if (!parcelId) throw new Error("Missing parcelId");

  const qrData = `parcel:${parcelId}`;
  const qrImage = await QRCode.toDataURL(qrData);

  await db.collection("parcels").doc(parcelId).update({ qrCode: qrImage });

  return { qrCode: qrImage };
});

// Login User (REMOVED - now handled client-side)
// exports.loginUser = onCall(async (data, context) => {
//   return { message: "Login endpoint hit" };
// });

// Register Driver
exports.registerDriver = onCall(async (data, context) => {
  const { name, email, phone, vehicle } = data;
  if (!name || !email || !phone || !vehicle)
    throw new Error("Missing required fields");

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
  const { senderId, receiverName, receiverAddress, weight, status } = data;

  if (!senderId || !receiverName || !receiverAddress || !weight)
    throw new Error("Missing required parcel fields");

  const parcelRef = db.collection("parcels").doc();

  await parcelRef.set({
    senderId,
    receiverName,
    receiverAddress,
    weight,
    status: status || "pending",
    createdAt: new Date().toISOString(),
  });

  return { id: parcelRef.id, message: "Parcel created" };
});

// Assign Driver
exports.assignDriver = onCall(async (data, context) => {
  const { parcelId, driverId } = data;
  if (!parcelId || !driverId) throw new Error("Missing IDs");

  await db.collection("parcels").doc(parcelId).update({
    driverId,
    assignedAt: new Date().toISOString(),
  });

  return { message: "Driver assigned" };
});

// Update Parcel Status
exports.updateParcelStatus = onCall(async (data, context) => {
  const { parcelId, status } = data;
  if (!parcelId || !status) throw new Error("Missing fields");

  await db.collection("parcels").doc(parcelId).update({
    status,
    statusUpdatedAt: new Date().toISOString(),
  });

  return { message: "Parcel status updated" };
});

// Send Driver Message
exports.sendDriverMessage = onCall(async (data, context) => {
  const { driverId, message } = data;
  if (!driverId || !message) throw new Error("Missing fields");

  const msgRef = db
    .collection("drivers")
    .doc(driverId)
    .collection("messages")
    .doc();

  await msgRef.set({
    message,
    sentAt: new Date().toISOString(),
  });

  return { id: msgRef.id, message: "Message sent" };
});

// Scan Parcel
exports.scanParcel = onCall(async (data, context) => {
  const { parcelId, scannedBy } = data;
  if (!parcelId || !scannedBy) throw new Error("Missing fields");

  const scanRef = db
    .collection("parcels")
    .doc(parcelId)
    .collection("scans")
    .doc();

  await scanRef.set({
    scannedBy,
    scannedAt: new Date().toISOString(),
  });

  return { id: scanRef.id, message: "Parcel scanned" };
});

// Order History
exports.getOrderHistory = onCall(async (data, context) => {
  const { userId } = data;
  if (!userId) throw new Error("Missing userId");

  const snap = await db
    .collection("parcels")
    .where("senderId", "==", userId)
    .get();

  const orders = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  return { orders };
});
