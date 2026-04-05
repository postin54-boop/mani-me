/**
 * Centralized Stripe instance with circuit breaker protection
 * All controllers should import from here instead of initializing separately
 */

const logger = require('./logger');
const { circuitBreakers } = require('./circuitBreaker');

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

/**
 * Execute a Stripe API call with circuit breaker protection
 * Prevents cascading failures if Stripe is down
 * @param {Function} fn - Async function that calls Stripe API
 * @returns {Promise} Result of the Stripe call
 * @throws {Error} Circuit breaker error if Stripe is unavailable
 */
async function withCircuitBreaker(fn) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }
  return circuitBreakers.stripe.execute(fn);
}

module.exports = stripe;
module.exports.withCircuitBreaker = withCircuitBreaker;
module.exports.circuitBreaker = circuitBreakers.stripe;
