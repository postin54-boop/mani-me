/**
 * Redis Configuration
 * Provides connection for caching and job queues
 * Falls back to in-memory when Redis is not available
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection
 * @returns {Promise<Redis|null>} Redis client or null if unavailable
 */
const initRedis = async () => {
  // Skip if no Redis URL configured
  if (!process.env.REDIS_URL) {
    logger.info('Redis URL not configured - using in-memory cache');
    return null;
  }

  try {
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 10000,
    });

    // Test connection
    await redisClient.connect();
    await redisClient.ping();
    
    isRedisAvailable = true;
    logger.info('✅ Redis connected successfully');

    // Handle connection events
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      isRedisAvailable = true;
      logger.info('Redis ready');
    });

    return redisClient;
  } catch (error) {
    logger.warn('Redis connection failed - using in-memory cache:', error.message);
    isRedisAvailable = false;
    return null;
  }
};

/**
 * Get Redis client (for direct operations)
 */
const getRedisClient = () => redisClient;

/**
 * Check if Redis is available
 */
const isRedisConnected = () => isRedisAvailable;

/**
 * Graceful shutdown
 */
const closeRedis = async () => {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
};

module.exports = {
  initRedis,
  getRedisClient,
  isRedisConnected,
  closeRedis,
};
