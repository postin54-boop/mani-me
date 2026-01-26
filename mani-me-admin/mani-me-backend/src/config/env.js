// ======================
// Environment Configuration
// ======================
// Centralized config with validation

require('dotenv').config();
const Joi = require('joi');

// Define schema for environment variables
const envSchema = Joi.object({
  // Server
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(4000),
  
  // Database
  MONGODB_URI: Joi.string().required().description('MongoDB connection string'),
  
  // Authentication
  JWT_SECRET: Joi.string().min(32).required().description('JWT signing secret'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  
  // Stripe
  STRIPE_SECRET_KEY: Joi.string().allow('').optional(),
  STRIPE_PUBLISHABLE_KEY: Joi.string().allow('').optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  
  // Firebase
  FIREBASE_PROJECT_ID: Joi.string().allow('').optional(),
  
  // Admin
  ADMIN_EMAIL: Joi.string().email().optional(),
  ADMIN_PASSWORD: Joi.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // CORS
  CORS_ORIGINS: Joi.string().default('http://localhost:3000'),
  
}).unknown(true); // Allow other env vars

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
  stripUnknown: false,
});

if (error) {
  const missingVars = error.details.map(d => d.message).join('\n');
  console.error('❌ Environment validation failed:');
  console.error(missingVars);
  
  // In production, fail fast. In dev, warn but continue
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Environment validation failed: ${missingVars}`);
  }
}

// Export validated config object
const config = {
  // Server
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  isProduction: envVars.NODE_ENV === 'production',
  isDevelopment: envVars.NODE_ENV === 'development',
  isTest: envVars.NODE_ENV === 'test',
  
  // Database
  db: {
    uri: envVars.MONGODB_URI,
    options: {
      maxPoolSize: envVars.NODE_ENV === 'production' ? 100 : 10,
      minPoolSize: envVars.NODE_ENV === 'production' ? 10 : 2,
    },
  },
  
  // Authentication
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
  },
  
  // Stripe
  stripe: {
    secretKey: envVars.STRIPE_SECRET_KEY,
    publishableKey: envVars.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: envVars.STRIPE_WEBHOOK_SECRET,
    isConfigured: !!envVars.STRIPE_SECRET_KEY,
  },
  
  // Firebase
  firebase: {
    projectId: envVars.FIREBASE_PROJECT_ID,
    isConfigured: !!envVars.FIREBASE_PROJECT_ID,
  },
  
  // Admin
  admin: {
    email: envVars.ADMIN_EMAIL,
    password: envVars.ADMIN_PASSWORD,
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  // Logging
  logging: {
    level: envVars.LOG_LEVEL,
  },
  
  // CORS
  cors: {
    origins: envVars.CORS_ORIGINS.split(',').map(s => s.trim()),
  },
};

// Log config status (not secrets)
if (config.isDevelopment) {
  console.log('📋 Config loaded:', {
    env: config.env,
    port: config.port,
    dbConfigured: !!config.db.uri,
    stripeConfigured: config.stripe.isConfigured,
    firebaseConfigured: config.firebase.isConfigured,
  });
}

module.exports = config;
