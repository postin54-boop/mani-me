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

module.exports = {
  sendEmail,
  sendPasswordResetEmail,
};
