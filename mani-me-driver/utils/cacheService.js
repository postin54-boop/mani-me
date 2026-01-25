/**
 * Cache Service with LRU (Least Recently Used) eviction
 * Prevents memory leaks by limiting cache size
 * Production-ready for 10k-50k users
 */

import logger from './logger';

// Maximum number of items to store in cache
const MAX_CACHE_SIZE = 100;

// Default TTL (Time To Live) in milliseconds - 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * LRU Cache implementation
 */
class LRUCache {
  constructor(maxSize = MAX_CACHE_SIZE) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.timestamps = new Map();
  }

  /**
   * Get an item from the cache
   * @param {string} key - Cache key
   * @returns {any} Cached value or undefined if not found/expired
   */
  get(key) {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const item = this.cache.get(key);
    const timestamp = this.timestamps.get(key);
    
    // Check if expired
    if (timestamp && Date.now() > timestamp.expiry) {
      this.delete(key);
      return undefined;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item;
  }

  /**
   * Set an item in the cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (optional)
   */
  set(key, value, ttl = DEFAULT_TTL) {
    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest items if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
      logger.log(`Cache evicted oldest item: ${oldestKey}`);
    }

    // Add new item
    this.cache.set(key, value);
    this.timestamps.set(key, {
      created: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  /**
   * Delete an item from the cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  /**
   * Check if a key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    if (!this.cache.has(key)) {
      return false;
    }
    
    const timestamp = this.timestamps.get(key);
    if (timestamp && Date.now() > timestamp.expiry) {
      this.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Clear all items from the cache
   */
  clear() {
    this.cache.clear();
    this.timestamps.clear();
    logger.log('Cache cleared');
  }

  /**
   * Get current cache size
   * @returns {number}
   */
  get size() {
    return this.cache.size;
  }

  /**
   * Get cache statistics
   * @returns {object}
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilizationPercent: Math.round((this.cache.size / this.maxSize) * 100),
    };
  }
}

// Singleton instance
const cacheService = new LRUCache(MAX_CACHE_SIZE);

/**
 * Helper function to create cache keys
 * @param {string} namespace - Cache namespace (e.g., 'shipments', 'drivers')
 * @param {...string} parts - Key parts to join
 * @returns {string}
 */
export const createCacheKey = (namespace, ...parts) => {
  return `${namespace}:${parts.join(':')}`;
};

/**
 * Cached API call wrapper
 * @param {string} cacheKey - Cache key
 * @param {Function} fetchFn - Async function to call if cache miss
 * @param {number} ttl - Cache TTL in milliseconds
 * @returns {Promise<any>}
 */
export const cachedFetch = async (cacheKey, fetchFn, ttl = DEFAULT_TTL) => {
  // Check cache first
  const cached = cacheService.get(cacheKey);
  if (cached !== undefined) {
    logger.log(`Cache hit: ${cacheKey}`);
    return cached;
  }

  // Cache miss - fetch fresh data
  logger.log(`Cache miss: ${cacheKey}`);
  const data = await fetchFn();
  
  // Store in cache
  cacheService.set(cacheKey, data, ttl);
  
  return data;
};

/**
 * Invalidate cache entries by pattern
 * @param {string} pattern - Pattern to match (namespace prefix)
 */
export const invalidateByPattern = (pattern) => {
  let invalidated = 0;
  for (const key of cacheService.cache.keys()) {
    if (key.startsWith(pattern)) {
      cacheService.delete(key);
      invalidated++;
    }
  }
  logger.log(`Invalidated ${invalidated} cache entries matching: ${pattern}`);
};

export default cacheService;
