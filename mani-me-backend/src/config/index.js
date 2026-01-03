// ======================
// Central Configuration Export
// ======================
// Single entry point for all configuration

const env = require('./env');
const connectDB = require('./db');

// Re-export everything
module.exports = {
  // Environment config
  ...env,
  
  // Database connection
  connectDB,
  
  // Helper to get config summary (safe for logging)
  getSummary: () => ({
    environment: env.env,
    port: env.port,
    database: env.db.uri ? 'configured' : 'missing',
    stripe: env.stripe.isConfigured ? 'configured' : 'missing',
    firebase: env.firebase.isConfigured ? 'configured' : 'missing',
    jwt: env.jwt.secret ? 'configured' : 'missing',
  }),
};
