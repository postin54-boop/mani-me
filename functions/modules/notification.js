// Notification logic for Firebase Functions (Expo push)
const { Expo } = require('expo-server-sdk');
const expo = new Expo();

/**
 * Send a push notification to a single device
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data payload
 * @returns {Promise<object>} - Notification ticket
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
  try {
    if (!pushToken) {
      console.warn('No push token provided');
      return null;
    }
    
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      return null;
    }
    
    const message = {
      to: pushToken,
      sound: 'default',
      title,
      body,
      data,
      priority: 'high',
    };
    
    const ticketChunk = await expo.sendPushNotificationsAsync([message]);
    console.log('Notification sent:', ticketChunk);
    return ticketChunk;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Don't throw - notification failures shouldn't break the app
    return null;
  }
}

/**
 * Send notifications to multiple devices in batches
 * @param {Array<{token: string, title: string, body: string, data: object}>} notifications
 * @returns {Promise<Array>} - Array of notification tickets
 */
async function sendBatchNotifications(notifications) {
  try {
    const messages = notifications
      .filter(n => n.token && Expo.isExpoPushToken(n.token))
      .map(n => ({
        to: n.token,
        sound: 'default',
        title: n.title,
        body: n.body,
        data: n.data || {},
        priority: 'high',
      }));

    if (messages.length === 0) {
      console.log('No valid tokens to send notifications to');
      return [];
    }

    // Expo recommends sending in chunks of 100
    const chunks = expo.chunkPushNotifications(messages);
    const tickets = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (error) {
        console.error('Error sending notification chunk:', error);
      }
    }

    return tickets;
  } catch (error) {
    console.error('Error in batch notifications:', error);
    return [];
  }
}

/**
 * Send shipment status update notification
 */
async function sendShipmentStatusNotification(pushToken, trackingNumber, status) {
  const statusMessages = {
    pending: 'Your parcel booking is pending confirmation 📋',
    booked: 'Your parcel has been booked successfully! 📝',
    driver_arrived: 'The driver has arrived for pickup! 🚗',
    parcel_received: 'Your parcel has been received by the driver 📦',
    payment_confirmed: 'Payment has been confirmed ✅',
    picked_up: 'Your parcel has been picked up! 📦',
    in_transit: 'Your parcel is now in transit to Ghana! ✈️',
    customs: 'Your parcel is going through customs clearance 🛃',
    out_for_delivery: 'Your parcel is out for delivery! 🚚',
    delivered: 'Your parcel has been delivered! ✅',
    cancelled: 'Your parcel booking has been cancelled ❌',
  };
  
  const title = 'Parcel Update';
  const body = statusMessages[status] || `Status updated to ${status}`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber,
    status,
    type: 'shipment_update',
  });
}

/**
 * Send notification when pickup is assigned to driver
 */
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

/**
 * Send notification when delivery is assigned to Ghana driver
 */
async function sendDeliveryAssignedNotification(pushToken, shipment, driver = {}) {
  const title = 'New Delivery Assigned';
  const body = `You have been assigned a delivery: ${shipment.tracking_number} to ${shipment.delivery_address}`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber: shipment.tracking_number,
    deliveryAddress: shipment.delivery_address,
    deliveryCity: shipment.delivery_city,
    type: 'driver_delivery_assigned',
    role: 'driver',
    driverId: driver.id || undefined,
  });
}

/**
 * Send notification when pickup is cancelled
 */
async function sendPickupCancellationNotification(pushToken, shipment, reason = '') {
  const title = 'Pickup Cancelled';
  const body = reason 
    ? `Pickup for ${shipment.tracking_number} has been cancelled: ${reason}`
    : `Pickup for ${shipment.tracking_number} has been cancelled`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber: shipment.tracking_number,
    type: 'pickup_cancelled',
  });
}

/**
 * Send notification when pickup is rescheduled
 */
async function sendPickupRescheduleNotification(pushToken, shipment, newDate, reason = '') {
  const title = 'Pickup Rescheduled';
  const formattedDate = new Date(newDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const body = `Pickup for ${shipment.tracking_number} has been rescheduled to ${formattedDate}`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber: shipment.tracking_number,
    newPickupDate: newDate,
    reason,
    type: 'pickup_rescheduled',
  });
}

/**
 * Send warehouse status update notification
 */
async function sendWarehouseStatusNotification(pushToken, shipment, warehouseStatus) {
  const statusMessages = {
    received: 'Your parcel has arrived at our warehouse 📦',
    sorted: 'Your parcel has been sorted for shipping 📋',
    packed: 'Your parcel has been packed and is ready for dispatch ✅',
    shipped: 'Your parcel has been shipped to Ghana! ✈️',
  };
  
  const title = 'Warehouse Update';
  const body = statusMessages[warehouseStatus] || `Warehouse status: ${warehouseStatus}`;
  return sendPushNotification(pushToken, title, body, {
    trackingNumber: shipment.tracking_number,
    warehouseStatus,
    type: 'warehouse_update',
  });
}

module.exports = {
  sendPushNotification,
  sendBatchNotifications,
  sendShipmentStatusNotification,
  sendPickupAssignedNotification,
  sendDeliveryAssignedNotification,
  sendPickupCancellationNotification,
  sendPickupRescheduleNotification,
  sendWarehouseStatusNotification,
};
