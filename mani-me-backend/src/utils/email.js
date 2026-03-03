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

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  sendVerificationSuccessEmail,
};
