// Server entry point
require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { PORT = 4000 } = process.env;

// Track server health
let isShuttingDown = false;

// Handle uncaught exceptions - log but don't crash for operational errors
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
  
  // Only exit for truly fatal errors (not operational ones)
  if (err.code === 'EADDRINUSE') {
    console.error('Port already in use. Exiting...');
    process.exit(1);
  }
  // For other errors, log but try to continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
  // Don't exit - just log the error
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`\n📴 ${signal} received. Shutting down gracefully...`);
  
  // Close server first (stop accepting new connections)
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
  }
  
  // Close database connection
  const mongoose = require('mongoose');
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB:', err);
  }
  
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server with retry logic
let server;
let retryCount = 0;
const MAX_RETRIES = 3;

const startServer = async () => {
  try {
    await connectDB();
    
    server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`   Accessible at: http://192.168.0.138:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   Process ID: ${process.pid}`);
      retryCount = 0; // Reset retry count on successful start
    });
    
    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        if (retryCount < MAX_RETRIES) {
          retryCount++;
          console.log(`   Retrying in 3 seconds... (attempt ${retryCount}/${MAX_RETRIES})`);
          setTimeout(startServer, 3000);
        } else {
          console.error('   Max retries reached. Exiting...');
          process.exit(1);
        }
      } else {
        console.error('❌ Server error:', err);
      }
    });
    
    // Keep-alive settings for better connection handling
    server.keepAliveTimeout = 65000; // Slightly higher than load balancer timeout
    server.headersTimeout = 66000;
    
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`   Retrying in 5 seconds... (attempt ${retryCount}/${MAX_RETRIES})`);
      setTimeout(startServer, 5000);
    } else {
      process.exit(1);
    }
  }
};

startServer();
