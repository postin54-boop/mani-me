/**
 * Email Utility
 * Sends transactional emails via SendGrid
 * Falls back to console logging if SendGrid is not configured
 * @module utils/email
 */

const sgMail = require('@sendgrid/mail');
const logger = require('./logger');

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@manime.co.uk';
const FROM_NAME = process.env.FROM_NAME || 'Mani Me';

// Initialize SendGrid if API key is available
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
  logger.info('SendGrid initialized');
} else {
  logger.warn('SENDGRID_API_KEY not set - emails will be logged to console only');
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 */
const sendEmail = async ({ to, subject, text, html }) => {
  const msg = {
    to,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject,
    text,
    html,
  };

  if (!SENDGRID_API_KEY) {
    // Log the email for development/testing
    logger.info('Email (not sent - no SendGrid key):', {
      to: msg.to,
      subject: msg.subject,
      text: msg.text,
    });
    console.log('=== EMAIL (DEV MODE) ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('========================');
    return { success: true, mode: 'console' };
  }

  try {
    await sgMail.send(msg);
    logger.info('Email sent successfully', { to, subject });
    return { success: true, mode: 'sendgrid' };
  } catch (error) {
    logger.error('Failed to send email', {
      to,
      subject,
      error: error.message,
      response: error.response?.body,
    });
    throw error;
  }
};

/**
 * Send password reset email
 * @param {string} email - User's email
 * @param {string} resetCode - 6-digit reset code
 */
const sendPasswordResetEmail = async (email, resetCode) => {
  return sendEmail({
    to: email,
    subject: 'Mani Me - Password Reset Code',
    text: `Your password reset code is: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <h2 style="color: #83C5FA; margin-bottom: 24px;">Password Reset</h2>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">You requested a password reset for your Mani Me account.</p>
        <div style="background: #16244a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="font-size: 14px; color: #999; margin-bottom: 8px;">Your reset code</p>
          <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #83C5FA; margin: 0;">${resetCode}</p>
        </div>
        <p style="font-size: 14px; color: #999;">This code expires in <strong>15 minutes</strong>.</p>
        <p style="font-size: 14px; color: #999;">If you did not request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666;">Mani Me - UK to Ghana Parcel Delivery</p>
      </div>
    `,
  });
};

/**
 * Send welcome email with verification code
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} verificationCode - 6-digit verification code
 */
const sendWelcomeEmail = async (email, name, verificationCode) => {
  return sendEmail({
    to: email,
    subject: 'Welcome to Mani Me! Please verify your email 🎉',
    text: `Hi ${name},\n\nWelcome to Mani Me! Thank you for signing up.\n\nPlease verify your email address using this code: ${verificationCode}\n\nThis code expires in 24 hours.\n\nWith Mani Me, you can easily send parcels from the UK to Ghana with reliable tracking and competitive prices.\n\nIf you have any questions, feel free to reach out to our support team.\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #83C5FA; margin: 0; font-size: 28px;">Welcome to Mani Me! 🎉</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Thank you for joining Mani Me! We're excited to have you on board.</p>
        
        <div style="background: #16244a; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <p style="font-size: 14px; color: #999; margin-bottom: 8px;">Your verification code</p>
          <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #83C5FA; margin: 0;">${verificationCode}</p>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center;">Enter this code in the app to verify your email.<br/>This code expires in <strong>24 hours</strong>.</p>
        
        <div style="background: #16244a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <h3 style="color: #83C5FA; margin: 0 0 12px 0; font-size: 16px;">What you can do with Mani Me:</h3>
          <ul style="color: #ccc; margin: 0; padding-left: 20px; line-height: 1.8;">
            <li>📦 Send parcels from UK to Ghana</li>
            <li>🚚 Schedule convenient pickups</li>
            <li>📍 Track your parcels in real-time</li>
            <li>💳 Multiple payment options</li>
          </ul>
        </div>
        
        <p style="font-size: 14px; color: #999;">If you didn't create this account, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0;">Mani Me - UK to Ghana Parcel Delivery</p>
          <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Questions? Contact us at support@manime.co.uk</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send email verification success notification
 * @param {string} email - User's email
 * @param {string} name - User's name
 */
const sendVerificationSuccessEmail = async (email, name) => {
  return sendEmail({
    to: email,
    subject: 'Email Verified Successfully ✅',
    text: `Hi ${name},\n\nYour email has been verified successfully! You now have full access to all Mani Me features.\n\nStart sending parcels to Ghana today!\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: #10B98120; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">✅</span>
          </div>
          <h2 style="color: #83C5FA; margin: 0;">Email Verified!</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Great news! Your email has been verified successfully. You now have full access to all Mani Me features.</p>
        
        <div style="background: #10B98120; border: 1px solid #10B981; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
          <p style="color: #10B981; margin: 0; font-weight: 600;">Your account is now fully activated!</p>
        </div>
        
        <p style="font-size: 14px; color: #ccc;">Ready to send your first parcel? Open the app and book a pickup today.</p>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Mani Me - UK to Ghana Parcel Delivery</p>
      </div>
    `,
  });
};

/**
 * Send booking confirmation email
 * @param {Object} shipment - Shipment details
 */
const sendBookingConfirmationEmail = async (shipment) => {
  const {
    sender_email,
    sender_name,
    tracking_number,
    receiver_name,
    delivery_city,
    pickup_date,
    pickup_time,
    total_cost,
    parcel_size,
  } = shipment;

  if (!sender_email) return;

  const formattedDate = new Date(pickup_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const sizeLabels = {
    small_box: 'Small Box',
    medium_box: 'Medium Box',
    large_box: 'Large Box',
    extra_large_box: 'Extra-Large Box',
    barrel: 'Barrel',
  };

  return sendEmail({
    to: sender_email,
    subject: `Booking Confirmed! 📦 ${tracking_number}`,
    text: `Hi ${sender_name},\n\nYour parcel booking has been confirmed!\n\nTracking Number: ${tracking_number}\nTo: ${receiver_name}, ${delivery_city}\nPickup: ${formattedDate}, ${pickup_time}\nSize: ${sizeLabels[parcel_size] || parcel_size}\nTotal: £${total_cost}\n\nTrack your parcel anytime in the Mani Me app.\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #83C5FA; margin: 0; font-size: 24px;">Booking Confirmed! 📦</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Great news! Your parcel booking has been confirmed.</p>
        
        <div style="background: #16244a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="text-align: center; margin-bottom: 16px;">
            <p style="font-size: 12px; color: #999; margin: 0;">TRACKING NUMBER</p>
            <p style="font-size: 20px; font-weight: bold; color: #83C5FA; margin: 4px 0; letter-spacing: 2px;">${tracking_number}</p>
          </div>
          
          <div style="border-top: 1px solid #23325c; padding-top: 16px;">
            <table style="width: 100%; color: #ccc; font-size: 14px;">
              <tr>
                <td style="padding: 8px 0; color: #999;">Recipient</td>
                <td style="padding: 8px 0; text-align: right;">${receiver_name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999;">Destination</td>
                <td style="padding: 8px 0; text-align: right;">${delivery_city}, Ghana</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999;">Pickup Date</td>
                <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999;">Time Slot</td>
                <td style="padding: 8px 0; text-align: right;">${pickup_time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #999;">Parcel Size</td>
                <td style="padding: 8px 0; text-align: right;">${sizeLabels[parcel_size] || parcel_size}</td>
              </tr>
            </table>
          </div>
          
          <div style="border-top: 1px solid #23325c; padding-top: 16px; margin-top: 8px;">
            <table style="width: 100%; font-size: 16px;">
              <tr>
                <td style="color: #fff; font-weight: 600;">Total Paid</td>
                <td style="text-align: right; color: #10B981; font-weight: bold; font-size: 20px;">£${total_cost}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center;">Track your parcel anytime in the Mani Me app.</p>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Mani Me - UK to Ghana Parcel Delivery</p>
      </div>
    `,
  });
};

/**
 * Send pickup scheduled email (driver assigned)
 * @param {Object} shipment - Shipment details
 * @param {string} driverName - Driver's name
 */
const sendPickupScheduledEmail = async (shipment, driverName) => {
  const { sender_email, sender_name, tracking_number, pickup_date, pickup_time } = shipment;
  
  if (!sender_email) return;

  const formattedDate = new Date(pickup_date).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return sendEmail({
    to: sender_email,
    subject: `Driver Assigned! 🚗 ${tracking_number}`,
    text: `Hi ${sender_name},\n\nA driver has been assigned for your parcel pickup.\n\nDriver: ${driverName}\nDate: ${formattedDate}\nTime: ${pickup_time}\n\nYou'll receive a notification when the driver is on their way.\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: #3B82F620; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">🚗</span>
          </div>
          <h2 style="color: #83C5FA; margin: 0;">Driver Assigned!</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Great news! A driver has been assigned to collect your parcel.</p>
        
        <div style="background: #16244a; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #999; margin: 0 0 8px 0;">Your Driver</p>
          <p style="font-size: 20px; color: #fff; font-weight: 600; margin: 0;">${driverName}</p>
          <p style="font-size: 14px; color: #83C5FA; margin: 12px 0 0 0;">${formattedDate} • ${pickup_time}</p>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center;">You'll receive a notification when the driver is on their way.</p>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Tracking: ${tracking_number}</p>
      </div>
    `,
  });
};

/**
 * Send parcel collected email
 * @param {Object} shipment - Shipment details
 */
const sendParcelCollectedEmail = async (shipment) => {
  const { sender_email, sender_name, tracking_number, receiver_name, delivery_city } = shipment;
  
  if (!sender_email) return;

  return sendEmail({
    to: sender_email,
    subject: `Parcel Collected! ✅ ${tracking_number}`,
    text: `Hi ${sender_name},\n\nYour parcel has been collected successfully!\n\nTracking: ${tracking_number}\nDestination: ${receiver_name}, ${delivery_city}\n\nYour parcel is now on its way to our UK warehouse for processing.\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 64px; height: 64px; background: #10B98120; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 32px;">✅</span>
          </div>
          <h2 style="color: #10B981; margin: 0;">Parcel Collected!</h2>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Your parcel has been collected successfully and is now on its way to our UK warehouse.</p>
        
        <div style="background: #16244a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 40px; height: 40px; background: #10B98120; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
              <span style="color: #10B981;">📦</span>
            </div>
            <div>
              <p style="margin: 0; color: #fff; font-weight: 600;">To: ${receiver_name}</p>
              <p style="margin: 0; color: #999; font-size: 14px;">${delivery_city}, Ghana</p>
            </div>
          </div>
        </div>
        
        <div style="background: #16244a; border-radius: 8px; padding: 12px; text-align: center;">
          <p style="font-size: 12px; color: #999; margin: 0;">Next Step</p>
          <p style="font-size: 14px; color: #83C5FA; margin: 4px 0 0 0;">Warehouse Processing → Transit to Ghana</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Tracking: ${tracking_number}</p>
      </div>
    `,
  });
};

/**
 * Send delivery confirmation email
 * @param {Object} shipment - Shipment details
 */
const sendDeliveryConfirmationEmail = async (shipment) => {
  const { sender_email, sender_name, tracking_number, receiver_name, delivery_city, delivery_address } = shipment;
  
  if (!sender_email) return;

  return sendEmail({
    to: sender_email,
    subject: `Delivered! 🎉 ${tracking_number}`,
    text: `Hi ${sender_name},\n\nGreat news! Your parcel has been delivered successfully!\n\nTracking: ${tracking_number}\nDelivered to: ${receiver_name}\nAddress: ${delivery_address}, ${delivery_city}\n\nThank you for using Mani Me!\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <div style="width: 80px; height: 80px; background: #10B98120; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
            <span style="font-size: 40px;">🎉</span>
          </div>
          <h1 style="color: #10B981; margin: 0; font-size: 28px;">Delivered!</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Great news! Your parcel has been delivered successfully to <strong style="color: #fff;">${receiver_name}</strong> in ${delivery_city}, Ghana.</p>
        
        <div style="background: #10B98115; border: 1px solid #10B98130; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
          <p style="font-size: 14px; color: #10B981; margin: 0;">✓ Delivery Complete</p>
          <p style="font-size: 12px; color: #999; margin: 8px 0 0 0;">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        
        <div style="text-align: center; margin: 24px 0;">
          <p style="font-size: 14px; color: #ccc;">Thank you for choosing <strong style="color: #83C5FA;">Mani Me</strong>!</p>
          <p style="font-size: 14px; color: #999;">We hope to serve you again soon.</p>
        </div>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Tracking: ${tracking_number}</p>
      </div>
    `,
  });
};

/**
 * Send order receipt email (for shop purchases)
 * @param {Object} options - Order details
 */
const sendOrderReceiptEmail = async ({ email, name, orderType, orderId, items, total }) => {
  if (!email) return;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px 0; color: #ccc; border-bottom: 1px solid #23325c;">${item.name}</td>
      <td style="padding: 12px 0; color: #999; text-align: center; border-bottom: 1px solid #23325c;">×${item.quantity}</td>
      <td style="padding: 12px 0; color: #fff; text-align: right; border-bottom: 1px solid #23325c;">£${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  return sendEmail({
    to: email,
    subject: `Order Confirmed! 🛒 #${orderId.slice(-8).toUpperCase()}`,
    text: `Hi ${name},\n\nYour ${orderType} order has been confirmed!\n\nOrder ID: ${orderId}\nTotal: £${total.toFixed(2)}\n\nWe'll notify you when your order is ready.\n\n- The Mani Me Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px; background: #0B1A33; border-radius: 16px; color: #fff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #83C5FA; margin: 0; font-size: 24px;">Order Confirmed! 🛒</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Hi <strong style="color: #fff;">${name}</strong>,</p>
        <p style="font-size: 16px; line-height: 1.6; color: #ccc;">Thanks for your ${orderType.toLowerCase()} order!</p>
        
        <div style="background: #16244a; border-radius: 12px; padding: 20px; margin: 24px 0;">
          <div style="text-align: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid #23325c;">
            <p style="font-size: 12px; color: #999; margin: 0;">ORDER ID</p>
            <p style="font-size: 16px; font-weight: bold; color: #83C5FA; margin: 4px 0;">#${orderId.slice(-8).toUpperCase()}</p>
          </div>
          
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 8px 0; color: #999; text-align: left; font-weight: normal;">Item</th>
                <th style="padding: 8px 0; color: #999; text-align: center; font-weight: normal;">Qty</th>
                <th style="padding: 8px 0; color: #999; text-align: right; font-weight: normal;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #23325c;">
            <table style="width: 100%; font-size: 18px;">
              <tr>
                <td style="color: #fff; font-weight: 600;">Total</td>
                <td style="text-align: right; color: #10B981; font-weight: bold;">£${total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        </div>
        
        <p style="font-size: 14px; color: #999; text-align: center;">We'll notify you when your order is ready for collection.</p>
        
        <hr style="border: none; border-top: 1px solid #23325c; margin: 24px 0;" />
        <p style="font-size: 12px; color: #666; text-align: center;">Mani Me - UK to Ghana Parcel Delivery</p>
      </div>
    `,
  });
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationSuccessEmail,
  sendBookingConfirmationEmail,
  sendPickupScheduledEmail,
  sendParcelCollectedEmail,
  sendDeliveryConfirmationEmail,
  sendOrderReceiptEmail,
};
