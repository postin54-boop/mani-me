// Central app entry point
const express = require('express');
const app = express();
const { errorHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { v4: uuidv4 } = require('uuid');

// ======================
// Security Middleware (CRITICAL)
// ======================

// Helmet for security headers (OWASP recommended)
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding from mobile apps
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// ======================
// Performance Middleware
// ======================

// Trust proxy for proper IP detection behind load balancer
app.set('trust proxy', 1);

// Request ID for distributed tracing
app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Request timeout middleware (prevent hanging requests)
const timeout = require('connect-timeout');
app.use(timeout('30s')); // 30 second timeout for all requests

// Compression for response bodies
const compression = require('compression');
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6, // Balance between speed and compression
}));

// CORS configuration - Allow all origins for now (can restrict later)
const cors = require('cors');
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:4000',
  'http://localhost:8081',
  'http://localhost:19006',
  'https://mani-me-admin.vercel.app',
  'https://mani-me.vercel.app',
  'https://manime.co.uk',
  'https://admin.manime.co.uk',
  'https://mani-me.onrender.com'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all origins in development or if origin is in whitelist
    if (allowedOrigins.includes(origin) || 
        origin.endsWith('.vercel.app') || 
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.netlify.app') ||
        process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // Log blocked origins for debugging
    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, true); // Allow anyway for now - tighten later
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Apply rate limiting globally to all API routes
app.use('/api', apiLimiter);

// Body parsing with size limits (reduced for security)
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Input sanitization middleware (prevents NoSQL injection)
const { sanitizeMiddleware } = require('./utils/sanitize');
app.use(sanitizeMiddleware);

// Request logging with structured logger
const logger = require('./utils/logger');
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log slow requests or errors
    if (duration > 1000 || res.statusCode >= 400) {
      logger.info('Request completed', {
        requestId: req.id,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });
    }
  });
  next();
});

// Health check endpoint (before rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Also support /api/health for consistency
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).send('🚚 ManiMe Backend is Live');
});

// Halt processing if request has timed out
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// ======================
// API Routes (v1 - versioned for future compatibility)
// ======================
const apiV1 = express.Router();

// Mount all routes on v1 router
apiV1.use('/admin', require('./routes/admin'));
apiV1.use('/bookings', require('./routes/booking'));
apiV1.use('/parcel-prices', require('./routes/parcelPrice'));
apiV1.use('/parcels', require('./routes/parcel'));
apiV1.use('/shipments', require('./routes/shipment'));
apiV1.use('/tracking', require('./routes/tracking'));
apiV1.use('/payments', require('./routes/payment'));
apiV1.use('/notifications', require('./routes/notification'));
apiV1.use('/auth', require('./routes/auth'));
apiV1.use('/drivers', require('./routes/driver'));
apiV1.use('/products', require('./routes/product'));
apiV1.use('/categories', require('./routes/category'));
apiV1.use('/chat', require('./routes/chat'));
apiV1.use('/cash-reconciliation', require('./routes/cashReconciliation'));
apiV1.use('/shop', require('./routes/shop'));
apiV1.use('/grocery', require('./routes/grocery'));
apiV1.use('/settings', require('./routes/settings'));
apiV1.use('/labels', require('./routes/labels'));
apiV1.use('/users', require('./routes/userRoutes'));
apiV1.use('/addresses', require('./routes/addressRoutes'));
apiV1.use('/items', require('./routes/itemRoutes'));
apiV1.use('/scans', require('./routes/scans'));
apiV1.use('/upload', require('./routes/upload'));
apiV1.use('/promo-codes', require('./routes/promoCode'));

// Mount v1 API (both /api and /api/v1 for backwards compatibility)
app.use('/api/v1', apiV1);
app.use('/api', apiV1); // Backwards compatible - remove in v2

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Central error handler (must be last)
app.use(errorHandler);

module.exports = app;
