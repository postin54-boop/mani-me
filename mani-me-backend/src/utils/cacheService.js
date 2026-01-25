/**
 * Unified Cache Service
 * Abstracts caching to support both in-memory and Redis
 * Automatically falls back to in-memory when Redis is unavailable
 */

const { getRedisClient, isRedisConnected } = require('../config/redis');
const logger = require('./logger');

// In-memory cache (fallback)
const memoryCache = new Map();
const memoryCacheStats = { hits: 0, misses: 0 };

/**
 * @typedef {Object} CacheOptions
 * @property {number} ttl - Time to live in seconds (default: 300)
 * @property {string} prefix - Key prefix for namespacing
 */

/**
 * Generate cache key with optional prefix
 * @param {string} key - Base key
 * @param {string} prefix - Optional prefix
 * @returns {string} Full cache key
 */
const makeKey = (key, prefix = '') => {
  return prefix ? `${prefix}:${key}` : key;
};

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @param {CacheOptions} options - Cache options
 * @returns {Promise<any|null>} Cached value or null
 */
const get = async (key, options = {}) => {
  const fullKey = makeKey(key, options.prefix);

  // Try Redis first
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      const value = await redis.get(fullKey);
      if (value) {
        return JSON.parse(value);
      }
      return null;
    } catch (error) {
      logger.warn('Redis get error, falling back to memory:', error.message);
    }
  }

  // Fallback to memory cache
  const item = memoryCache.get(fullKey);
  if (!item) {
    memoryCacheStats.misses++;
    return null;
  }

  // Check expiration
  if (item.expiresAt && Date.now() > item.expiresAt) {
    memoryCache.delete(fullKey);
    memoryCacheStats.misses++;
    return null;
  }

  memoryCacheStats.hits++;
  return item.value;
};

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {CacheOptions} options - Cache options
 * @returns {Promise<boolean>} Success status
 */
const set = async (key, value, options = {}) => {
  const fullKey = makeKey(key, options.prefix);
  const ttl = options.ttl || 300; // 5 minutes default

  // Try Redis first
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      await redis.setex(fullKey, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn('Redis set error, falling back to memory:', error.message);
    }
  }

  // Fallback to memory cache
  memoryCache.set(fullKey, {
    value,
    expiresAt: Date.now() + (ttl * 1000),
  });
  return true;
};

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @param {CacheOptions} options - Cache options
 * @returns {Promise<boolean>} Success status
 */
const del = async (key, options = {}) => {
  const fullKey = makeKey(key, options.prefix);

  // Try Redis first
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      await redis.del(fullKey);
    } catch (error) {
      logger.warn('Redis del error:', error.message);
    }
  }

  // Always delete from memory too
  memoryCache.delete(fullKey);
  return true;
};

/**
 * Delete all keys matching a pattern
 * @param {string} pattern - Key pattern (e.g., "user:*")
 * @returns {Promise<number>} Number of keys deleted
 */
const delPattern = async (pattern) => {
  let count = 0;

  // Redis pattern delete
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        count = await redis.del(...keys);
      }
    } catch (error) {
      logger.warn('Redis delPattern error:', error.message);
    }
  }

  // Memory cache pattern delete
  for (const key of memoryCache.keys()) {
    if (key.match(new RegExp(pattern.replace('*', '.*')))) {
      memoryCache.delete(key);
      count++;
    }
  }

  return count;
};

/**
 * Get or set cache value (cache-aside pattern)
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not cached
 * @param {CacheOptions} options - Cache options
 * @returns {Promise<any>} Cached or fetched value
 */
const getOrSet = async (key, fetchFn, options = {}) => {
  // Try to get from cache
  const cached = await get(key, options);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const value = await fetchFn();
  
  // Cache the result
  if (value !== null && value !== undefined) {
    await set(key, value, options);
  }

  return value;
};

/**
 * Clear all cache (use sparingly)
 */
const clear = async () => {
  if (isRedisConnected()) {
    try {
      const redis = getRedisClient();
      await redis.flushdb();
    } catch (error) {
      logger.warn('Redis flush error:', error.message);
    }
  }
  memoryCache.clear();
};

/**
 * Get cache statistics
 */
const getStats = () => ({
  isRedis: isRedisConnected(),
  memorySize: memoryCache.size,
  memoryHits: memoryCacheStats.hits,
  memoryMisses: memoryCacheStats.misses,
  hitRate: memoryCacheStats.hits / (memoryCacheStats.hits + memoryCacheStats.misses) || 0,
});

// Pre-defined cache key generators
const cacheKeys = {
  shipment: (id) => `shipment:${id}`,
  shipmentByTracking: (tracking) => `shipment:tracking:${tracking}`,
  userShipments: (userId, page = 1) => `user:${userId}:shipments:page:${page}`,
  prices: () => 'prices:all',
  settings: () => 'settings:global',
  driver: (id) => `driver:${id}`,
  driverAssignments: (driverId) => `driver:${driverId}:assignments`,
  products: (category) => `products:${category || 'all'}`,
};

module.exports = {
  get,
  set,
  del,
  delPattern,
  getOrSet,
  clear,
  getStats,
  cacheKeys,
};
