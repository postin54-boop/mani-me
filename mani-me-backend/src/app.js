// Central app entry point
const express = require('express');
const app = express();
const { errorHandler } = require('./middleware/errorHandler');

// ======================
// Security & Performance Middleware
// ======================

// Trust proxy for proper IP detection behind load balancer
app.set('trust proxy', 1);

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

// CORS configuration
const cors = require('cors');
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging (lightweight)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log slow requests or errors
    if (duration > 1000 || res.statusCode >= 400) {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
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
  res.json({ 
    name: 'Mani-Me Backend API',
    version: '1.0.0',
    status: 'running',
  });
});

// Halt processing if request has timed out
app.use((req, res, next) => {
  if (!req.timedout) next();
});

// ======================
// API Routes
// ======================
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/parcel-prices', require('./routes/parcelPrice'));
app.use('/api/parcels', require('./routes/parcel'));
app.use('/api/shipments', require('./routes/shipment'));
app.use('/api/tracking', require('./routes/tracking'));
app.use('/api/payments', require('./routes/payment'));
app.use('/api/notifications', require('./routes/notification'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/drivers', require('./routes/driver'));
app.use('/api/products', require('./routes/product'));
app.use('/api/categories', require('./routes/category'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/cash-reconciliation', require('./routes/cashReconciliation'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/grocery', require('./routes/grocery'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/labels', require('./routes/labels'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/addresses', require('./routes/addressRoutes'));
app.use('/api/items', require('./routes/itemRoutes'));
app.use('/api/scans', require('./routes/scans'));
app.use('/api/upload', require('./routes/upload'));

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// Central error handler (must be last)
app.use(errorHandler);

module.exports = app;
