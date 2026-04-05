/**
 * Circuit Breaker Pattern
 * Prevents cascading failures when external services are down
 * 
 * States:
 * - CLOSED: Normal operation, requests go through
 * - OPEN: Service is down, requests fail fast without calling the service
 * - HALF_OPEN: Testing if service recovered, limited requests allowed
 */
const logger = require('./logger');

const STATES = {
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
  /**
   * @param {string} name - Name of the service (for logging)
   * @param {object} options - Configuration options
   * @param {number} options.failureThreshold - Number of failures before opening circuit (default: 5)
   * @param {number} options.resetTimeout - Time in ms before trying again (default: 30000)
   * @param {number} options.halfOpenMaxAttempts - Max attempts in half-open state (default: 3)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 30000; // 30 seconds
    this.halfOpenMaxAttempts = options.halfOpenMaxAttempts || 3;
    this.halfOpenAttempts = 0;
  }

  /**
   * Check if circuit should transition from OPEN to HALF_OPEN
   */
  shouldTryReset() {
    if (this.state !== STATES.OPEN) return false;
    const now = Date.now();
    return (now - this.lastFailureTime) >= this.resetTimeout;
  }

  /**
   * Record a successful call
   */
  onSuccess() {
    this.failureCount = 0;
    
    if (this.state === STATES.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.halfOpenMaxAttempts) {
        this.state = STATES.CLOSED;
        this.halfOpenAttempts = 0;
        this.successCount = 0;
        logger.info(`Circuit breaker [${this.name}] closed - service recovered`);
      }
    }
  }

  /**
   * Record a failed call
   */
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.state === STATES.HALF_OPEN) {
      // Failed in half-open state, go back to open
      this.state = STATES.OPEN;
      this.halfOpenAttempts = 0;
      this.successCount = 0;
      logger.warn(`Circuit breaker [${this.name}] reopened - service still failing`);
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = STATES.OPEN;
      logger.error(`Circuit breaker [${this.name}] opened - too many failures`, {
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }

  /**
   * Execute a function with circuit breaker protection
   * @param {Function} fn - Async function to execute
   * @returns {Promise} Result of the function or throws CircuitOpenError
   */
  async execute(fn) {
    // Check if we should try resetting
    if (this.shouldTryReset()) {
      this.state = STATES.HALF_OPEN;
      this.halfOpenAttempts = 0;
      this.successCount = 0;
      logger.info(`Circuit breaker [${this.name}] half-open - testing recovery`);
    }

    // If circuit is open, fail fast
    if (this.state === STATES.OPEN) {
      const error = new Error(`Circuit breaker [${this.name}] is OPEN - service unavailable`);
      error.code = 'CIRCUIT_OPEN';
      error.retryAfter = Math.ceil((this.resetTimeout - (Date.now() - this.lastFailureTime)) / 1000);
      throw error;
    }

    // If half-open, limit attempts
    if (this.state === STATES.HALF_OPEN) {
      this.halfOpenAttempts++;
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Get current state for monitoring
   */
  getState() {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      config: {
        failureThreshold: this.failureThreshold,
        resetTimeout: this.resetTimeout
      }
    };
  }

  /**
   * Manually reset the circuit breaker
   */
  reset() {
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.halfOpenAttempts = 0;
    this.lastFailureTime = null;
    logger.info(`Circuit breaker [${this.name}] manually reset`);
  }
}

// Pre-configured circuit breakers for common external services
const circuitBreakers = {
  stripe: new CircuitBreaker('stripe', { failureThreshold: 5, resetTimeout: 30000 }),
  sendgrid: new CircuitBreaker('sendgrid', { failureThreshold: 5, resetTimeout: 60000 }),
  expo: new CircuitBreaker('expo', { failureThreshold: 10, resetTimeout: 30000 }),
  firebase: new CircuitBreaker('firebase', { failureThreshold: 5, resetTimeout: 30000 })
};

/**
 * Get all circuit breaker states (for monitoring endpoint)
 */
function getAllStates() {
  return Object.values(circuitBreakers).map(cb => cb.getState());
}

module.exports = {
  CircuitBreaker,
  circuitBreakers,
  getAllStates,
  STATES
};
