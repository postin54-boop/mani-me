const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a user's device
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
  // Check that the push token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    console.error(`Push token ${pushToken} is not a valid Expo push token`);
    return;
  }

  // Construct the notification message
  const message = {
    to: pushToken,
    sound: 'default',
    title: title,
    body: body,
    data: data,
    priority: 'high',
  };

  try {
    // Send the notification
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log('Notification sent:', ticketChunk);
    return ticketChunk;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
}

/**
 * Send shipment status update notification
 * @param {string} pushToken - User's Expo push token
 * @param {string} trackingNumber - Shipment tracking number
 * @param {string} status - New shipment status
 */
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

module.exports = {
  sendPushNotification,
  sendShipmentStatusNotification,
};
