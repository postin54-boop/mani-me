/**
 * Production-Ready Structured Logger
 * Uses Winston for structured JSON logging with correlation IDs
 */
const winston = require('winston');

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'mani-me-api',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    // Console transport for all environments
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' 
        ? logFormat  // JSON in production
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          )
    }),
  ],
});

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({ 
    filename: 'logs/error.log', 
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
  }));
  logger.add(new winston.transports.File({ 
    filename: 'logs/combined.log',
    maxsize: 5242880,
    maxFiles: 5,
  }));
}

// Helper for request logging with correlation ID
logger.logRequest = (req, message, meta = {}) => {
  logger.info(message, {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    ip: req.ip,
    userId: req.userId || 'anonymous',
    ...meta
  });
};

// Helper for error logging with correlation ID
logger.logError = (req, error, meta = {}) => {
  logger.error(error.message, {
    requestId: req?.id || 'no-request',
    stack: error.stack,
    method: req?.method,
    path: req?.originalUrl,
    userId: req?.userId || 'anonymous',
    ...meta
  });
};

// Backward compatibility - export as function and object
const log = (message, meta) => {
  logger.info(message, meta);
};
log.info = logger.info.bind(logger);
log.error = logger.error.bind(logger);
log.warn = logger.warn.bind(logger);
log.debug = logger.debug.bind(logger);
log.logRequest = logger.logRequest;
log.logError = logger.logError;

module.exports = log;
