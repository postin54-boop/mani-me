/**
 * Notification Service
 * Handles all push notifications via Expo
 * Integrates with job queue for async processing
 */
const { Expo } = require('expo-server-sdk');
const logger = require('../utils/logger');
const { addJob, registerProcessor, createQueue, QUEUE_NAMES } = require('../utils/jobQueue');

// Create a new Expo SDK client
const expo = new Expo();

/**
 * Send push notification to a user's device
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data to send with notification
 * @returns {Promise<Array>} Ticket chunk from Expo
 */
async function sendPushNotification(pushToken, title, body, data = {}) {
  // Check that the push token is valid
  if (!Expo.isExpoPushToken(pushToken)) {
    logger.warn('Invalid Expo push token:', { pushToken });
    return null;
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
    logger.info('Notification sent:', { pushToken: pushToken.slice(-10), title });
    return ticketChunk;
  } catch (error) {
    logger.error('Error sending notification:', { error: error.message, pushToken: pushToken.slice(-10) });
    throw error;
  }
}

/**
 * Queue a notification for async sending (uses job queue if available)
 * @param {string} pushToken - Expo push token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data
 */
async function queueNotification(pushToken, title, body, data = {}) {
  return addJob(QUEUE_NAMES.NOTIFICATIONS, { pushToken, title, body, data });
}

// Register notification processor
registerProcessor(QUEUE_NAMES.NOTIFICATIONS, async (data) => {
  const { pushToken, title, body, data: notifData } = data;
  return sendPushNotification(pushToken, title, body, notifData);
});

// Initialize queue when Redis is configured; gracefully falls back to immediate mode otherwise.
createQueue(QUEUE_NAMES.NOTIFICATIONS, async (data) => {
  const { pushToken, title, body, data: notifData } = data;
  return sendPushNotification(pushToken, title, body, notifData);
});

/**
 * Send notification to driver when a pickup is assigned
 * @param {string} pushToken - Driver's Expo push token
 * @param {object} shipment - Shipment object (with address, tracking number, etc)
 * @param {object} [driver] - Optional driver object (for name, etc)
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
 * Send notification to driver when a delivery is assigned (Ghana drivers)
 * @param {string} pushToken - Driver's Expo push token
 * @param {object} shipment - Shipment object (with address, tracking number, etc)
 * @param {object} [driver] - Optional driver object (for name, etc)
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
 * Send shipment status update notification
 * @param {string} pushToken - User's Expo push token
 * @param {string} trackingNumber - Shipment tracking number
 * @param {string} status - New shipment status
 */
async function sendShipmentStatusNotification(pushToken, trackingNumber, status) {
  const statusMessages = {
    // Booking & Pickup
    booked: 'Your parcel has been booked successfully! 📝',
    pending_pickup: 'Your pickup is being scheduled 📅',
    driver_assigned: 'A driver has been assigned for your pickup! 🚗',
    driver_en_route: 'Your driver is on the way to collect your parcel! 🚗💨',
    picked_up: 'Your parcel has been picked up! 📦',
    parcel_collected: 'Your parcel has been picked up! 📦',
    
    // UK Warehouse
    at_uk_warehouse: 'Your parcel has arrived at our UK warehouse 🏭',
    processing: 'Your parcel is being processed for shipping ⚙️',
    departed_uk: 'Your parcel has left the UK! ✈️',
    
    // Transit & Ghana
    in_transit: 'Your parcel is now in transit to Ghana! ✈️',
    arrived_ghana: 'Your parcel has arrived in Ghana! 🇬🇭',
    customs: 'Your parcel is going through customs clearance 🛃',
    customs_cleared: 'Your parcel has cleared customs! ✅',
    
    // Delivery
    out_for_delivery: 'Your parcel is out for delivery! 🚚',
    delivered: 'Your parcel has been delivered! ✅🎉',
    
    // Exceptions
    on_hold: 'Your parcel is on hold. We will contact you shortly ⏸️',
    cancelled: 'Your shipment has been cancelled ❌',
    returned: 'Your parcel is being returned to sender 📤',
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
 * Send pickup cancellation notifications to drivers, admin, and customer
 * @param {object} shipment - Shipment object with user included
 */
async function sendPickupCancellationNotifications(shipment) {
  const { User } = require('../models');
  const notifications = [];

  // 1. Notify customer (confirmation)
  if (shipment.user && shipment.user.push_token) {
    notifications.push(
      sendPushNotification(
        shipment.user.push_token,
        '❌ Pickup Cancelled',
        `Your pickup for ${shipment.tracking_number} has been cancelled successfully.`,
        {
          trackingNumber: shipment.tracking_number,
          type: 'pickup_cancelled',
          role: 'customer'
        }
      )
    );
  }

  // 2. Notify UK drivers (pickup cancelled) - Use Mongoose find
  const ukDrivers = await User.find({
    role: 'driver',
    country: 'UK'
  });

  ukDrivers.forEach(driver => {
    notifications.push(
      sendPushNotification(
        driver.push_token,
        '⚠️ Pickup Cancelled',
        `Customer cancelled pickup for ${shipment.tracking_number} at ${shipment.pickup_address}`,
        {
          trackingNumber: shipment.tracking_number,
          pickupAddress: shipment.pickup_address,
          pickupCity: shipment.pickup_city,
          type: 'driver_pickup_cancelled',
          role: 'driver'
        }
      )
    );
  });

  // 3. Notify admins (cancellation) - Use Mongoose find
  const admins = await User.find({
    role: 'admin'
  });

  admins.forEach(admin => {
    notifications.push(
      sendPushNotification(
        admin.push_token,
        '🔔 Pickup Cancelled',
        `${shipment.sender_name} cancelled pickup ${shipment.tracking_number}`,
        {
          trackingNumber: shipment.tracking_number,
          customerName: shipment.sender_name,
          pickupAddress: shipment.pickup_address,
          type: 'admin_pickup_cancelled',
          role: 'admin'
        }
      )
    );
  });

  // Send all notifications
  return Promise.allSettled(notifications);
}

/**
 * Send pickup reschedule notifications to drivers, admin, and customer
 * @param {object} shipment - Shipment object with user included
 * @param {string} oldDate - Original pickup date
 * @param {string} newDate - New pickup date
 * @param {string} reason - Reschedule reason
 */
async function sendPickupRescheduleNotifications(shipment, oldDate, newDate, reason) {
  const { User } = require('../models');
  const notifications = [];

  // 1. Notify customer (confirmation)
  if (shipment.user && shipment.user.push_token) {
    notifications.push(
      sendPushNotification(
        shipment.user.push_token,
        '📅 Pickup Rescheduled',
        `Your pickup for ${shipment.tracking_number} has been moved to ${newDate}`,
        {
          trackingNumber: shipment.tracking_number,
          oldDate,
          newDate,
          reason,
          type: 'pickup_rescheduled',
          role: 'customer'
        }
      )
    );
  }

  // 2. Notify UK drivers (pickup rescheduled) - Use Mongoose find
  const ukDrivers = await User.find({
    role: 'driver',
    country: 'UK'
  });

  ukDrivers.forEach(driver => {
    notifications.push(
      sendPushNotification(
        driver.push_token,
        '📅 Pickup Rescheduled',
        `${shipment.tracking_number} moved from ${oldDate} to ${newDate}. Reason: ${reason}`,
        {
          trackingNumber: shipment.tracking_number,
          oldDate,
          newDate,
          reason,
          pickupAddress: shipment.pickup_address,
          pickupCity: shipment.pickup_city,
          type: 'driver_pickup_rescheduled',
          role: 'driver'
        }
      )
    );
  });

  // 3. Notify admins (reschedule) - Use Mongoose find
  const admins = await User.find({
    role: 'admin'
  });

  admins.forEach(admin => {
    notifications.push(
      sendPushNotification(
        admin.push_token,
        '🔔 Pickup Rescheduled',
        `${shipment.sender_name} rescheduled ${shipment.tracking_number} to ${newDate}`,
        {
          trackingNumber: shipment.tracking_number,
          customerName: shipment.sender_name,
          oldDate,
          newDate,
          reason,
          pickupAddress: shipment.pickup_address,
          type: 'admin_pickup_rescheduled',
          role: 'admin'
        }
      )
    );
  });

  // Send all notifications
  return Promise.allSettled(notifications);
}

/**
 * Send notifications when customer cancels drop-off and switches to pickup
 * @param {Object} shipment - The shipment object with user populated
 */
async function sendDropoffCancelledNotifications(shipment) {
  const { User } = require('../models');
  const notifications = [];

  // 1. Notify customer (confirmation)
  if (shipment.userId && shipment.userId.push_token) {
    notifications.push(
      sendPushNotification(
        shipment.userId.push_token,
        '📦 Drop-off Cancelled',
        `Your drop-off for ${shipment.tracking_number} has been cancelled. A driver will pick up your parcel instead.`,
        {
          trackingNumber: shipment.tracking_number,
          type: 'dropoff_cancelled',
          role: 'customer'
        }
      )
    );
  }

  // 2. Notify UK drivers (new pickup available)
  const ukDrivers = await User.find({
    role: 'driver',
    country: 'UK',
    push_token: { $exists: true, $ne: null }
  });

  ukDrivers.forEach(driver => {
    if (driver.push_token) {
      notifications.push(
        sendPushNotification(
          driver.push_token,
          '📦 New Pickup Available',
          `Customer switched from drop-off to pickup for ${shipment.tracking_number} at ${shipment.pickup_address || shipment.pickup_city}`,
          {
            trackingNumber: shipment.tracking_number,
            pickupAddress: shipment.pickup_address,
            pickupCity: shipment.pickup_city,
            type: 'driver_dropoff_cancelled',
            role: 'driver'
          }
        )
      );
    }
  });

  // 3. Notify admins
  const admins = await User.find({
    role: 'admin',
    push_token: { $exists: true, $ne: null }
  });

  admins.forEach(admin => {
    if (admin.push_token) {
      notifications.push(
        sendPushNotification(
          admin.push_token,
          '📋 Drop-off Cancelled',
          `Shipment ${shipment.tracking_number} switched from drop-off to driver pickup`,
          {
            trackingNumber: shipment.tracking_number,
            type: 'admin_dropoff_cancelled',
            role: 'admin'
          }
        )
      );
    }
  });

  // Send all notifications
  return Promise.allSettled(notifications);
}

/**
 * Send notification when support team replies to a user's chat
 * @param {string} pushToken - User's Expo push token
 * @param {string} message - Preview of the message
 * @param {string} userId - User ID for navigation
 */
async function sendSupportChatReplyNotification(pushToken, message, userId) {
  // Truncate message for notification preview
  const messagePreview = message.length > 100 ? message.substring(0, 100) + '...' : message;
  
  return sendPushNotification(
    pushToken,
    '💬 Support Team Reply',
    messagePreview,
    {
      type: 'support_chat_reply',
      userId: userId,
      screen: 'SupportChat',
    }
  );
}

/**
 * Send broadcast notification to multiple users (for promos, marketing, announcements)
 * @param {Array} users - Array of user objects with push_token
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} data - Additional data (type, promoCode, etc.)
 * @returns {Promise<object>} Results summary
 */
async function sendBroadcastNotification(users, title, body, data = {}) {
  const results = { sent: 0, failed: 0, noToken: 0, errors: [] };
  
  const notifications = users.map(async (user) => {
    if (!user.push_token) {
      results.noToken++;
      return null;
    }
    
    try {
      await queueNotification(user.push_token, title, body, {
        ...data,
        userId: user._id,
      });
      results.sent++;
    } catch (error) {
      results.failed++;
      results.errors.push({ userId: user._id, error: error.message });
    }
  });
  
  await Promise.allSettled(notifications);
  
  logger.info('Broadcast notification complete', { 
    title,
    sent: results.sent, 
    failed: results.failed, 
    noToken: results.noToken 
  });
  
  return results;
}

/**
 * Send promo notification to all users
 * @param {string} promoCode - Promo code
 * @param {string} discount - Discount description (e.g., "20% off")
 * @param {string} message - Custom message
 * @param {Date} expiresAt - Expiration date
 */
async function sendPromoNotification(promoCode, discount, message, expiresAt) {
  const User = require('../models/user');
  
  const users = await User.find({
    role: 'CUSTOMER',
    push_token: { $exists: true, $ne: null, $ne: '' }
  }).select('push_token _id fullName');
  
  const title = '🎉 Special Offer!';
  const body = message || `Use code ${promoCode} to get ${discount}! Limited time offer.`;
  
  return sendBroadcastNotification(users, title, body, {
    type: 'promo',
    promoCode,
    discount,
    expiresAt: expiresAt?.toISOString(),
    screen: 'BookingScreen',
  });
}

/**
 * Send marketing/announcement notification to all users
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {string} targetScreen - Screen to open when tapped
 */
async function sendMarketingNotification(title, message, targetScreen = 'Home') {
  const User = require('../models/user');
  
  const users = await User.find({
    role: 'CUSTOMER',
    push_token: { $exists: true, $ne: null, $ne: '' }
  }).select('push_token _id fullName');
  
  return sendBroadcastNotification(users, title, message, {
    type: 'marketing',
    screen: targetScreen,
  });
}

module.exports = {
  sendPushNotification,
  sendShipmentStatusNotification,
  sendPickupCancellationNotifications,
  sendPickupRescheduleNotifications,
  sendPickupAssignedNotification,
  sendDeliveryAssignedNotification,
  sendDropoffCancelledNotifications,
  sendSupportChatReplyNotification,
  sendBroadcastNotification,
  sendPromoNotification,
  sendMarketingNotification,
};
