// Notification logic for Firebase Functions (Expo push)
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

async function sendPushNotification(pushToken, title, body, data = {}) {
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
    priority: 'high',
  };
  try {
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log('Notification sent:', ticketChunk);
    return ticketChunk;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

async function sendShipmentStatusNotification(pushToken, trackingNumber, status) {
  const statusMessages = {
    booked: 'Your parcel has been booked successfully! 📝',
    picked_up: 'Your parcel has been picked up! 📦',
    in_transit: 'Your parcel is now in transit to Ghana! ✈️',
    customs: 'Your parcel is going through customs clearance 🛃',
    out_for_delivery: 'Your parcel is out for delivery! 🚚',
    delivered: 'Your parcel has been delivered! ✅',
  };
  const title = 'Parcel Update';
  const body = statusMessages[status] || `Status updated to ${status}`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber,
    status,
    type: 'shipment_update',
  });
}

async function sendPickupAssignedNotification(pushToken, shipment, driver = {}) {
  const title = 'New Pickup Assigned';
  const body = `You have been assigned a new pickup: ${shipment.tracking_number} at ${shipment.pickup_address}`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber: shipment.tracking_number,
    pickupAddress: shipment.pickup_address,
    pickupCity: shipment.pickup_city,
    type: 'driver_pickup_assigned',
    role: 'driver',
    driverId: driver.id || undefined,
  });
}

module.exports = {
  sendPushNotification,
  sendShipmentStatusNotification,
  sendPickupAssignedNotification,
};
