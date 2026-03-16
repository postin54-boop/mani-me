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

// Brand constants
const BRAND = {
  LOGO_URL: 'https://www.manime.co.uk/images/logo.png',
  WEBSITE_URL: 'https://www.manime.co.uk',
  PRIMARY_COLOR: '#0B1A33',      // Navy blue
  SECONDARY_COLOR: '#83C5FA',    // Sky blue
  SUCCESS_COLOR: '#10B981',      // Green
  CARD_BG: '#16244a',            // Dark card background
  BORDER_COLOR: '#23325c',       // Border color
  TEXT_LIGHT: '#ccc',
  TEXT_MUTED: '#999',
  TEXT_DARK: '#666',
  SUPPORT_EMAIL: 'manimeappinfo@gmail.com',
};

/**
 * Generate branded email HTML wrapper
 * @param {string} content - Inner HTML content
 * @param {Object} options - Optional settings
 * @param {boolean} options.showLogo - Whether to show logo (default: true)
 * @returns {string} Complete branded HTML email
 */
const brandedEmailTemplate = (content, options = {}) => {
  const { showLogo = true } = options;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Mani Me</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, sans-serif;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f4f4f4;">
        <tr>
          <td align="center" style="padding: 24px 16px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 520px; background: ${BRAND.PRIMARY_COLOR}; border-radius: 16px; overflow: hidden;">
              ${showLogo ? `
              <!-- Logo Header -->
              <tr>
                <td align="center" style="padding: 32px 32px 16px 32px; background: linear-gradient(180deg, #0d1f3c 0%, ${BRAND.PRIMARY_COLOR} 100%);">
                  <img src="${BRAND.LOGO_URL}" alt="Mani Me" width="120" style="display: block; max-width: 120px; height: auto;" />
                </td>
              </tr>
              ` : ''}
              
              <!-- Main Content -->
              <tr>
                <td style="padding: ${showLogo ? '16px' : '32px'} 32px 32px 32px;">
                  ${content}
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 0 32px 32px 32px;">
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                    <tr>
                      <td style="border-top: 1px solid ${BRAND.BORDER_COLOR}; padding-top: 24px;">
                        <p style="font-size: 12px; color: ${BRAND.TEXT_DARK}; text-align: center; margin: 0;">
                          Mani Me - UK to Ghana Parcel Delivery
                        </p>
                        <p style="font-size: 12px; color: ${BRAND.TEXT_DARK}; text-align: center; margin: 8px 0 0 0;">
                          <a href="${BRAND.WEBSITE_URL}" style="color: ${BRAND.SECONDARY_COLOR}; text-decoration: none;">www.manime.co.uk</a>
                        </p>
                        <p style="font-size: 11px; color: ${BRAND.TEXT_DARK}; text-align: center; margin: 16px 0 0 0;">
                          Questions? Contact us at <a href="mailto:${BRAND.SUPPORT_EMAIL}" style="color: ${BRAND.SECONDARY_COLOR}; text-decoration: none;">${BRAND.SUPPORT_EMAIL}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
};

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
  const content = `
    <h2 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0 0 24px 0; text-align: center;">Password Reset</h2>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">You requested a password reset for your Mani Me account.</p>
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; margin-bottom: 8px;">Your reset code</p>
      <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: ${BRAND.SECONDARY_COLOR}; margin: 0;">${resetCode}</p>
    </div>
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED};">This code expires in <strong style="color: #fff;">15 minutes</strong>.</p>
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED};">If you did not request this, please ignore this email.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Mani Me - Password Reset Code',
    text: `Your password reset code is: ${resetCode}\n\nThis code expires in 15 minutes.\n\nIf you did not request this, please ignore this email.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send welcome email with verification code
 * @param {string} email - User's email
 * @param {string} name - User's name
 * @param {string} verificationCode - 6-digit verification code
 */
const sendWelcomeEmail = async (email, name, verificationCode) => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0; font-size: 28px;">Welcome to Mani Me! 🎉</h1>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Thank you for joining Mani Me! We're excited to have you on board.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; margin-bottom: 8px;">Your verification code</p>
      <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: ${BRAND.SECONDARY_COLOR}; margin: 0;">${verificationCode}</p>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; text-align: center;">Enter this code in the app to verify your email.<br/>This code expires in <strong style="color: #fff;">24 hours</strong>.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <h3 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0 0 12px 0; font-size: 16px;">What you can do with Mani Me:</h3>
      <table role="presentation" cellspacing="0" cellpadding="0" style="color: ${BRAND.TEXT_LIGHT}; font-size: 14px;">
        <tr><td style="padding: 6px 0;">📦 Send parcels from UK to Ghana</td></tr>
        <tr><td style="padding: 6px 0;">🚚 Schedule convenient pickups</td></tr>
        <tr><td style="padding: 6px 0;">📍 Track your parcels in real-time</td></tr>
        <tr><td style="padding: 6px 0;">💳 Multiple payment options</td></tr>
      </table>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED};">If you didn't create this account, please ignore this email.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to Mani Me! Please verify your email 🎉',
    text: `Hi ${name},\n\nWelcome to Mani Me! Thank you for signing up.\n\nPlease verify your email address using this code: ${verificationCode}\n\nThis code expires in 24 hours.\n\nWith Mani Me, you can easily send parcels from the UK to Ghana with reliable tracking and competitive prices.\n\nIf you have any questions, feel free to reach out to our support team.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send email verification success notification
 * @param {string} email - User's email
 * @param {string} name - User's name
 */
const sendVerificationSuccessEmail = async (email, name) => {
  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: ${BRAND.SUCCESS_COLOR}20; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h2 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0;">Email Verified!</h2>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Great news! Your email has been verified successfully. You now have full access to all Mani Me features.</p>
    
    <div style="background: ${BRAND.SUCCESS_COLOR}20; border: 1px solid ${BRAND.SUCCESS_COLOR}; border-radius: 12px; padding: 16px; text-align: center; margin: 24px 0;">
      <p style="color: ${BRAND.SUCCESS_COLOR}; margin: 0; font-weight: 600;">Your account is now fully activated!</p>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_LIGHT};">Ready to send your first parcel? Open the app and book a pickup today.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Email Verified Successfully ✅',
    text: `Hi ${name},\n\nYour email has been verified successfully! You now have full access to all Mani Me features.\n\nStart sending parcels to Ghana today!\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
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

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0; font-size: 24px;">Booking Confirmed! 📦</h1>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Great news! Your parcel booking has been confirmed.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="text-align: center; margin-bottom: 16px;">
        <p style="font-size: 12px; color: ${BRAND.TEXT_MUTED}; margin: 0;">TRACKING NUMBER</p>
        <p style="font-size: 20px; font-weight: bold; color: ${BRAND.SECONDARY_COLOR}; margin: 4px 0; letter-spacing: 2px;">${tracking_number}</p>
      </div>
      
      <div style="border-top: 1px solid ${BRAND.BORDER_COLOR}; padding-top: 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="color: ${BRAND.TEXT_LIGHT}; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: ${BRAND.TEXT_MUTED};">Recipient</td>
            <td style="padding: 8px 0; text-align: right;">${receiver_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND.TEXT_MUTED};">Destination</td>
            <td style="padding: 8px 0; text-align: right;">${delivery_city}, Ghana</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND.TEXT_MUTED};">Pickup Date</td>
            <td style="padding: 8px 0; text-align: right;">${formattedDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND.TEXT_MUTED};">Time Slot</td>
            <td style="padding: 8px 0; text-align: right;">${pickup_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: ${BRAND.TEXT_MUTED};">Parcel Size</td>
            <td style="padding: 8px 0; text-align: right;">${sizeLabels[parcel_size] || parcel_size}</td>
          </tr>
        </table>
      </div>
      
      <div style="border-top: 1px solid ${BRAND.BORDER_COLOR}; padding-top: 16px; margin-top: 8px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 16px;">
          <tr>
            <td style="color: #fff; font-weight: 600;">Total Paid</td>
            <td style="text-align: right; color: ${BRAND.SUCCESS_COLOR}; font-weight: bold; font-size: 20px;">£${total_cost}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; text-align: center;">Track your parcel anytime in the Mani Me app.</p>
  `;

  return sendEmail({
    to: sender_email,
    subject: `Booking Confirmed! 📦 ${tracking_number}`,
    text: `Hi ${sender_name},\n\nYour parcel booking has been confirmed!\n\nTracking Number: ${tracking_number}\nTo: ${receiver_name}, ${delivery_city}\nPickup: ${formattedDate}, ${pickup_time}\nSize: ${sizeLabels[parcel_size] || parcel_size}\nTotal: £${total_cost}\n\nTrack your parcel anytime in the Mani Me app.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
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

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: #3B82F620; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
        <span style="font-size: 32px;">🚗</span>
      </div>
      <h2 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0;">Driver Assigned!</h2>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Great news! A driver has been assigned to collect your parcel.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; margin: 0 0 8px 0;">Your Driver</p>
      <p style="font-size: 20px; color: #fff; font-weight: 600; margin: 0;">${driverName}</p>
      <p style="font-size: 14px; color: ${BRAND.SECONDARY_COLOR}; margin: 12px 0 0 0;">${formattedDate} • ${pickup_time}</p>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; text-align: center;">You'll receive a notification when the driver is on their way.</p>
    <p style="font-size: 12px; color: ${BRAND.TEXT_DARK}; text-align: center; margin-top: 16px;">Tracking: ${tracking_number}</p>
  `;

  return sendEmail({
    to: sender_email,
    subject: `Driver Assigned! 🚗 ${tracking_number}`,
    text: `Hi ${sender_name},\n\nA driver has been assigned for your parcel pickup.\n\nDriver: ${driverName}\nDate: ${formattedDate}\nTime: ${pickup_time}\n\nYou'll receive a notification when the driver is on their way.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send parcel collected email
 * @param {Object} shipment - Shipment details
 */
const sendParcelCollectedEmail = async (shipment) => {
  const { sender_email, sender_name, tracking_number, receiver_name, delivery_city } = shipment;
  
  if (!sender_email) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: ${BRAND.SUCCESS_COLOR}20; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h2 style="color: ${BRAND.SUCCESS_COLOR}; margin: 0;">Parcel Collected!</h2>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Your parcel has been collected successfully and is now on its way to our UK warehouse.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <table role="presentation" cellspacing="0" cellpadding="0" width="100%">
        <tr>
          <td width="52" valign="top">
            <div style="width: 40px; height: 40px; background: ${BRAND.SUCCESS_COLOR}20; border-radius: 50%; text-align: center; line-height: 40px;">
              <span style="color: ${BRAND.SUCCESS_COLOR};">📦</span>
            </div>
          </td>
          <td valign="top">
            <p style="margin: 0; color: #fff; font-weight: 600;">To: ${receiver_name}</p>
            <p style="margin: 4px 0 0 0; color: ${BRAND.TEXT_MUTED}; font-size: 14px;">${delivery_city}, Ghana</p>
          </td>
        </tr>
      </table>
    </div>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 8px; padding: 12px; text-align: center;">
      <p style="font-size: 12px; color: ${BRAND.TEXT_MUTED}; margin: 0;">Next Step</p>
      <p style="font-size: 14px; color: ${BRAND.SECONDARY_COLOR}; margin: 4px 0 0 0;">Warehouse Processing → Transit to Ghana</p>
    </div>
    
    <p style="font-size: 12px; color: ${BRAND.TEXT_DARK}; text-align: center; margin-top: 16px;">Tracking: ${tracking_number}</p>
  `;

  return sendEmail({
    to: sender_email,
    subject: `Parcel Collected! ✅ ${tracking_number}`,
    text: `Hi ${sender_name},\n\nYour parcel has been collected successfully!\n\nTracking: ${tracking_number}\nDestination: ${receiver_name}, ${delivery_city}\n\nYour parcel is now on its way to our UK warehouse for processing.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send delivery confirmation email
 * @param {Object} shipment - Shipment details
 */
const sendDeliveryConfirmationEmail = async (shipment) => {
  const { sender_email, sender_name, tracking_number, receiver_name, delivery_city, delivery_address } = shipment;
  
  if (!sender_email) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 80px; height: 80px; background: ${BRAND.SUCCESS_COLOR}20; border-radius: 50%; margin: 0 auto 16px; line-height: 80px;">
        <span style="font-size: 40px;">🎉</span>
      </div>
      <h1 style="color: ${BRAND.SUCCESS_COLOR}; margin: 0; font-size: 28px;">Delivered!</h1>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${sender_name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Great news! Your parcel has been delivered successfully to <strong style="color: #fff;">${receiver_name}</strong> in ${delivery_city}, Ghana.</p>
    
    <div style="background: ${BRAND.SUCCESS_COLOR}15; border: 1px solid ${BRAND.SUCCESS_COLOR}30; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="font-size: 14px; color: ${BRAND.SUCCESS_COLOR}; margin: 0;">✓ Delivery Complete</p>
      <p style="font-size: 12px; color: ${BRAND.TEXT_MUTED}; margin: 8px 0 0 0;">${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; color: ${BRAND.TEXT_LIGHT};">Thank you for choosing <strong style="color: ${BRAND.SECONDARY_COLOR};">Mani Me</strong>!</p>
      <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED};">We hope to serve you again soon.</p>
    </div>
    
    <p style="font-size: 12px; color: ${BRAND.TEXT_DARK}; text-align: center;">Tracking: ${tracking_number}</p>
  `;

  return sendEmail({
    to: sender_email,
    subject: `Delivered! 🎉 ${tracking_number}`,
    text: `Hi ${sender_name},\n\nGreat news! Your parcel has been delivered successfully!\n\nTracking: ${tracking_number}\nDelivered to: ${receiver_name}\nAddress: ${delivery_address}, ${delivery_city}\n\nThank you for using Mani Me!\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
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
      <td style="padding: 12px 0; color: ${BRAND.TEXT_LIGHT}; border-bottom: 1px solid ${BRAND.BORDER_COLOR};">${item.name}</td>
      <td style="padding: 12px 0; color: ${BRAND.TEXT_MUTED}; text-align: center; border-bottom: 1px solid ${BRAND.BORDER_COLOR};">×${item.quantity}</td>
      <td style="padding: 12px 0; color: #fff; text-align: right; border-bottom: 1px solid ${BRAND.BORDER_COLOR};">£${item.price.toFixed(2)}</td>
    </tr>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0; font-size: 24px;">Order Confirmed! 🛒</h1>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Thanks for your ${orderType.toLowerCase()} order!</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0;">
      <div style="text-align: center; margin-bottom: 16px; padding-bottom: 16px; border-bottom: 1px solid ${BRAND.BORDER_COLOR};">
        <p style="font-size: 12px; color: ${BRAND.TEXT_MUTED}; margin: 0;">ORDER ID</p>
        <p style="font-size: 16px; font-weight: bold; color: ${BRAND.SECONDARY_COLOR}; margin: 4px 0;">#${orderId.slice(-8).toUpperCase()}</p>
      </div>
      
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; border-collapse: collapse;">
        <thead>
          <tr>
            <th style="padding: 8px 0; color: ${BRAND.TEXT_MUTED}; text-align: left; font-weight: normal;">Item</th>
            <th style="padding: 8px 0; color: ${BRAND.TEXT_MUTED}; text-align: center; font-weight: normal;">Qty</th>
            <th style="padding: 8px 0; color: ${BRAND.TEXT_MUTED}; text-align: right; font-weight: normal;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid ${BRAND.BORDER_COLOR};">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 18px;">
          <tr>
            <td style="color: #fff; font-weight: 600;">Total</td>
            <td style="text-align: right; color: ${BRAND.SUCCESS_COLOR}; font-weight: bold;">£${total.toFixed(2)}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; text-align: center;">We'll notify you when your order is ready for collection.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Order Confirmed! 🛒 #${orderId.slice(-8).toUpperCase()}`,
    text: `Hi ${name},\n\nYour ${orderType} order has been confirmed!\n\nOrder ID: ${orderId}\nTotal: £${total.toFixed(2)}\n\nWe'll notify you when your order is ready.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send payment success email
 * @param {Object} options - Payment details
 */
const sendPaymentSuccessEmail = async ({ email, name, orderType, trackingNumber, amount }) => {
  if (!email) return;

  const orderTypeLabels = {
    shipment: 'Parcel Booking',
    grocery: 'Grocery Order',
    shopship: 'Shop & Ship Order'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: ${BRAND.SUCCESS_COLOR}20; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
        <span style="font-size: 32px;">✅</span>
      </div>
      <h2 style="color: ${BRAND.SUCCESS_COLOR}; margin: 0;">Payment Confirmed!</h2>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Your payment has been successfully processed.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="font-size: 12px; color: ${BRAND.TEXT_MUTED}; margin: 0 0 8px 0;">AMOUNT PAID</p>
      <p style="font-size: 28px; font-weight: bold; color: ${BRAND.SUCCESS_COLOR}; margin: 0;">£${amount}</p>
      ${trackingNumber ? `<p style="font-size: 14px; color: ${BRAND.SECONDARY_COLOR}; margin: 16px 0 0 0;">${trackingNumber}</p>` : ''}
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; text-align: center;">${orderTypeLabels[orderType] || 'Order'} confirmed. We'll keep you updated on the progress.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Confirmed! ✅ ${trackingNumber || ''}`,
    text: `Hi ${name},\n\nYour payment of £${amount} has been confirmed for your ${orderTypeLabels[orderType] || 'order'}.\n\n${trackingNumber ? `Tracking: ${trackingNumber}\n\n` : ''}Thank you for choosing Mani Me!\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send payment failed email
 * @param {Object} options - Payment details
 */
const sendPaymentFailedEmail = async ({ email, name, orderType, trackingNumber }) => {
  if (!email) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: #EF444420; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
        <span style="font-size: 32px;">❌</span>
      </div>
      <h2 style="color: #EF4444; margin: 0;">Payment Failed</h2>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Unfortunately, we couldn't process your payment.</p>
    
    <div style="background: #EF444415; border: 1px solid #EF444430; border-radius: 12px; padding: 16px; margin: 24px 0;">
      <p style="color: #EF4444; margin: 0; font-size: 14px;">This could be due to:</p>
      <table role="presentation" cellspacing="0" cellpadding="0" style="color: ${BRAND.TEXT_LIGHT}; margin: 12px 0 0 0; font-size: 14px;">
        <tr><td style="padding: 4px 0;">• Insufficient funds</td></tr>
        <tr><td style="padding: 4px 0;">• Card declined by your bank</td></tr>
        <tr><td style="padding: 4px 0;">• Incorrect card details</td></tr>
      </table>
    </div>
    
    <div style="text-align: center; margin: 24px 0;">
      <p style="font-size: 14px; color: ${BRAND.TEXT_LIGHT};">Please open the app and try again with a different payment method.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `Payment Failed ❌ - Action Required`,
    text: `Hi ${name},\n\nUnfortunately, your payment could not be processed.\n\nPlease try again with a different payment method or contact your bank.\n\nIf you need assistance, contact us at ${BRAND.SUPPORT_EMAIL}\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
  });
};

/**
 * Send refund confirmation email
 * @param {Object} options - Refund details
 */
const sendRefundEmail = async ({ email, name, amount, trackingNumber }) => {
  if (!email) return;

  const content = `
    <div style="text-align: center; margin-bottom: 24px;">
      <div style="width: 64px; height: 64px; background: ${BRAND.SECONDARY_COLOR}20; border-radius: 50%; margin: 0 auto 16px; line-height: 64px;">
        <span style="font-size: 32px;">💰</span>
      </div>
      <h2 style="color: ${BRAND.SECONDARY_COLOR}; margin: 0;">Refund Processed</h2>
    </div>
    
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Hi <strong style="color: #fff;">${name}</strong>,</p>
    <p style="font-size: 16px; line-height: 1.6; color: ${BRAND.TEXT_LIGHT};">Your refund has been processed successfully.</p>
    
    <div style="background: ${BRAND.CARD_BG}; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
      <p style="font-size: 12px; color: ${BRAND.TEXT_MUTED}; margin: 0 0 8px 0;">REFUND AMOUNT</p>
      <p style="font-size: 28px; font-weight: bold; color: ${BRAND.SECONDARY_COLOR}; margin: 0;">£${amount}</p>
    </div>
    
    <p style="font-size: 14px; color: ${BRAND.TEXT_MUTED}; text-align: center;">It may take 5-10 business days to appear in your account, depending on your bank.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Refund Processed 💰 ${trackingNumber || ''}`,
    text: `Hi ${name},\n\nYour refund of £${amount} has been processed.\n\nIt may take 5-10 business days to appear in your account, depending on your bank.\n\n- The Mani Me Team`,
    html: brandedEmailTemplate(content),
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
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendRefundEmail,
};
