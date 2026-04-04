/**
 * Centralized Stripe instance
 * All controllers should import from here instead of initializing separately
 */

const logger = require('./logger');

const rawKey = process.env.STRIPE_SECRET_KEY || '';
const stripeKey = rawKey.trim(); // Remove any accidental whitespace

if (!stripeKey) {
  logger.error('STRIPE_SECRET_KEY not set - payments will fail');
} else if (!stripeKey.startsWith('sk_')) {
  logger.error(`STRIPE_SECRET_KEY invalid: starts with "${stripeKey.slice(0, 8)}" (expected "sk_test_" or "sk_live_")`);
} else {
  logger.info(`Stripe initialized: prefix=${stripeKey.slice(0, 8)} length=${stripeKey.length}`);
}

const stripe = stripeKey ? require('stripe')(stripeKey) : null;

module.exports = stripe;
