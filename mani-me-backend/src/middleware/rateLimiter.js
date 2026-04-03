const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');

// Shared Redis client for rate limiting across cluster workers
// Falls back to in-memory store if REDIS_URL is not configured
let redisClient = null;
if (process.env.REDIS_URL) {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  redisClient.on('connect', () => console.log('✅ Redis connected for rate limiting'));
  redisClient.on('error', (err) => {
    // Don't crash if Redis is temporarily unavailable — rate limiters fall back gracefully
    console.error('Rate limiter Redis error:', err.message);
  });
}

const makeStore = (prefix) => redisClient
  ? new RedisStore({ sendCommand: (...args) => redisClient.call(...args), prefix })
  : undefined; // undefined = default MemoryStore

// Extract real client IP — works behind Render/Vercel load balancers
// X-Forwarded-For may be 'clientIp, proxy1, proxy2' — we want the first (leftmost) value
const getRealIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
};

// Rate limiter for login attempts - 10 failures per 15 minutes per real IP
const loginLimiter = rateLimit({
  store: makeStore('rl:login:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window per IP
  keyGenerator: getRealIp,
  message: 'Too many login attempts from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Only count failed attempts
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many login attempts. Please try again after 15 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for registration - 10 attempts per hour per real IP
const registerLimiter = rateLimit({
  store: makeStore('rl:register:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  keyGenerator: getRealIp,
  message: 'Too many accounts created from this IP, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful registrations
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many registration attempts. Please try again after 1 hour.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Rate limiter for password reset - 5 attempts per 30 minutes per real IP
const passwordResetLimiter = rateLimit({
  store: makeStore('rl:pwreset:'),
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 5,
  keyGenerator: getRealIp,
  message: 'Too many password reset attempts from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many password reset attempts. Please try again after 30 minutes.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// General API rate limiter - 300 requests per 15 minutes per real IP
const apiLimiter = rateLimit({
  store: makeStore('rl:api:'),
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: getRealIp,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health' || req.path === '/api/health';
  },
  handler: (req, res) => {
    res.status(429).json({
      message: 'Too many requests. Please slow down.',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Stricter rate limiter for tracking endpoint (public, could be abused)
const trackingLimiter = rateLimit({
  store: makeStore('rl:track:'),
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 tracking requests per 15 minutes
  keyGenerator: getRealIp,
  message: 'Too many tracking requests',
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  apiLimiter,
  trackingLimiter
};
