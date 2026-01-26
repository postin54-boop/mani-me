const mongoose = require("mongoose");

/**
 * MongoDB Connection Configuration
 * Optimized for 50k+ concurrent users with auto-reconnect
 */

let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = 5;

const connectDB = async () => {
  // Prevent multiple connection attempts
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return;
  }

  try {
    const options = {
      // Connection Pool Settings (critical for scale)
      maxPoolSize: 100,          // Max connections in pool (default is 5!)
      minPoolSize: 10,           // Keep minimum connections ready
      maxIdleTimeMS: 30000,      // Close idle connections after 30s
      
      // Timeouts
      serverSelectionTimeoutMS: 10000, // Timeout for server selection (increased)
      socketTimeoutMS: 45000,          // Timeout for socket operations
      connectTimeoutMS: 15000,         // Timeout for initial connection (increased)
      heartbeatFrequencyMS: 10000,     // How often to check server status
      
      // Write Concern for reliability
      w: 'majority',
      retryWrites: true,
      retryReads: true,
      
      // Read Preference for better performance
      readPreference: 'primaryPreferred',
      
      // Buffer commands when disconnected (helps with brief outages)
      bufferCommands: true,
      
      // Auto-reconnect settings
      autoIndex: true,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    connectionRetries = 0;
    
    // Log connection pool status
    const { connection } = mongoose;
    console.log(`✅ MongoDB connected successfully`);
    console.log(`   Host: ${connection.host}`);
    console.log(`   Database: ${connection.name}`);
    console.log(`   Pool Size: ${options.maxPoolSize}`);
    
    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
      isConnected = false;
    });
    
    connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB disconnected');
      isConnected = false;
      
      // Attempt to reconnect
      if (connectionRetries < MAX_RETRIES) {
        connectionRetries++;
        console.log(`   Attempting reconnect ${connectionRetries}/${MAX_RETRIES} in 5s...`);
        setTimeout(connectDB, 5000);
      }
    });
    
    connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      isConnected = true;
      connectionRetries = 0;
    });
    
    connection.on('close', () => {
      console.log('MongoDB connection closed');
      isConnected = false;
    });

  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    isConnected = false;
    
    // Retry connection
    if (connectionRetries < MAX_RETRIES) {
      connectionRetries++;
      console.log(`   Retrying connection ${connectionRetries}/${MAX_RETRIES} in 5s...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB();
    } else {
      console.error('   Max retries reached. Exiting...');
      process.exit(1);
    }
  }
};

// Export connection status checker
const isDBConnected = () => isConnected && mongoose.connection.readyState === 1;

module.exports = connectDB;
module.exports.isDBConnected = isDBConnected;
