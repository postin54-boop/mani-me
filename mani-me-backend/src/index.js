// ======================
// Mani Me Backend Server
// ======================
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const helmet = require("helmet");
const config = require('./config');
const { apiLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// CORS Configuration - Use config or defaults
const allowedOrigins = [
  ...config.cors.origins,
  'http://localhost:3000',
  'http://localhost:3001',
  'https://admin.manime.com',
  'http://192.168.0.138:3000',
  'http://192.168.0.138:3001',
  'http://192.168.1.181:3000',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('⚠️  CORS blocked request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(express.json());

// Apply global rate limiting to all API routes
app.use('/api', apiLimiter);

// Connect to MongoDB
mongoose.connect(config.db.uri, config.db.options)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Mani Me Backend Server',
    version: 'v1',
    environment: config.env,
    timestamp: new Date().toISOString()
  });
});

// Config status endpoint (dev only)
if (config.isDevelopment) {
  app.get('/config-status', (req, res) => {
    res.json(config.getSummary());
  });
}

// ========================================
// API VERSIONING - v1 Routes (Primary)
// ========================================
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/shipments", require("./routes/shipment"));
app.use("/api/v1/items", require("./routes/itemRoutes"));
app.use("/api/v1/auth", require("./routes/auth"));
app.use("/api/v1/addresses", require("./routes/addressRoutes"));
app.use("/api/v1/shop", require("./routes/shop"));
app.use("/api/v1/grocery", require("./routes/grocery"));
app.use("/api/v1/chat", require("./routes/chat"));
app.use("/api/v1/admin", require("./routes/admin"));
app.use("/api/v1/drivers", require("./routes/driver"));
app.use("/api/v1/parcels", require("./routes/parcel"));
app.use("/api/v1/parcel-prices", require("./routes/parcelPrice"));
app.use("/api/v1/notifications", require("./routes/notification"));
app.use("/api/v1/bookings", require("./routes/booking"));
app.use("/api/v1/tracking", require("./routes/tracking"));
app.use("/api/v1/payments", require("./routes/payment"));
app.use("/api/v1/products", require("./routes/product"));
app.use("/api/v1/categories", require("./routes/category"));
app.use("/api/v1/settings", require("./routes/settings"));
app.use("/api/v1/labels", require("./routes/labels"));
app.use("/api/v1/scans", require("./routes/scans"));
app.use("/api/v1/upload", require("./routes/upload"));
app.use("/api/v1/cash-reconciliation", require("./routes/cashReconciliation"));

// ========================================
// LEGACY ROUTES (Backward compatibility)
// These mirror v1 routes for existing clients
// ========================================
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api/shipments", require("./routes/shipment"));
app.use("/api/items", require("./routes/itemRoutes"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/addresses", require("./routes/addressRoutes"));
app.use("/api/shop", require("./routes/shop"));
app.use("/api/grocery", require("./routes/grocery"));
app.use("/api/chat", require("./routes/chat"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/drivers", require("./routes/driver"));
app.use("/api/parcels", require("./routes/parcel"));
app.use("/api/parcel-prices", require("./routes/parcelPrice"));
app.use("/api/notifications", require("./routes/notification"));
app.use("/api/bookings", require("./routes/booking"));
app.use("/api/tracking", require("./routes/tracking"));
app.use("/api/payments", require("./routes/payment"));
app.use("/api/products", require("./routes/product"));
app.use("/api/categories", require("./routes/category"));
app.use("/api/settings", require("./routes/settings"));
app.use("/api/labels", require("./routes/labels"));
app.use("/api/scans", require("./routes/scans"));
app.use("/api/upload", require("./routes/upload"));
app.use("/api/cash-reconciliation", require("./routes/cashReconciliation"));

// ========================================
// ERROR HANDLING
// ========================================
// 404 handler for undefined routes
app.use(notFoundHandler);

// Central error handler (must be last)
app.use(errorHandler);

// ========================================
// REQUEST LOGGING MIDDLEWARE
// ========================================
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log non-health check requests
    if (req.path !== '/' && req.path !== '/health') {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });
  next();
});

// ========================================
// GRACEFUL SHUTDOWN HANDLING
// ========================================
let isShuttingDown = false;

const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
  
  // Check if server is listening before trying to close
  if (server && server.listening) {
    server.close((err) => {
      if (err) {
        console.error('Error during server close:', err);
      } else {
        console.log('✅ HTTP server closed');
      }
      
      // Close database connection
      const mongoose = require('mongoose');
      mongoose.connection.close()
        .then(() => {
          console.log('✅ MongoDB connection closed');
          console.log('✅ Graceful shutdown complete');
          process.exit(0);
        })
        .catch((closeErr) => {
          console.error('Error closing MongoDB:', closeErr);
          process.exit(1);
        });
    });
  } else {
    // Server never started, just exit
    console.log('Server was not running, exiting...');
    process.exit(0);
  }
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  // Don't exit on unhandled rejection, just log it
});

// Start server
const server = app.listen(config.port, '0.0.0.0', () => {
  console.log(`\n🚀 Mani Me Backend Server Started`);
  console.log(`   ├─ Port: ${config.port}`);
  console.log(`   ├─ Environment: ${config.env}`);
  console.log(`   ├─ Local: http://localhost:${config.port}`);
  console.log(`   └─ Network: http://192.168.0.138:${config.port}\n`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
});
