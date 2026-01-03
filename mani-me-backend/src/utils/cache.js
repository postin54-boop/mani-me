/**
 * Simple In-Memory Cache Utility
 * For frequently accessed data (prices, settings, etc.)
 * 
 * For production with multiple instances, consider Redis instead.
 * This is suitable for data that doesn't need cross-instance sync.
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
    };
  }

  /**
   * Get item from cache
   * @param {string} key - Cache key
   * @returns {any|null} - Cached value or null if not found/expired
   */
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      return null;
    }
    
    // Check expiration
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    return item.value;
  }

  /**
   * Set item in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttlSeconds - Time to live in seconds (default: 5 minutes)
   */
  set(key, value, ttlSeconds = 300) {
    const expiresAt = ttlSeconds > 0 ? Date.now() + (ttlSeconds * 1000) : null;
    
    this.cache.set(key, {
      value,
      expiresAt,
      createdAt: Date.now(),
    });
  }

  /**
   * Delete item from cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Delete entries matching a pattern
   * @param {string} pattern - Key pattern to match (e.g., 'user:*')
   */
  deletePattern(pattern) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get or set pattern (fetch from source if not cached)
   * @param {string} key - Cache key
   * @param {Function} fetchFn - Async function to fetch data if not cached
   * @param {number} ttlSeconds - Time to live in seconds
   * @returns {any} - Cached or freshly fetched value
   */
  async getOrSet(key, fetchFn, ttlSeconds = 300) {
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }
    
    const value = await fetchFn();
    this.set(key, value, ttlSeconds);
    return value;
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? ((this.stats.hits / total) * 100).toFixed(2) + '%' : '0%',
      size: this.cache.size,
    };
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (item.expiresAt && now > item.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    return cleaned;
  }
}

// Singleton instance
const cache = new CacheManager();

// Auto-cleanup every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Cache key generators for consistency
const cacheKeys = {
  // User-related
  user: (userId) => `user:${userId}`,
  userShipments: (userId) => `user:${userId}:shipments`,
  
  // Settings/Prices (rarely change)
  prices: () => 'settings:prices',
  settings: (key) => `settings:${key}`,
  
  // Shipment-related
  shipment: (id) => `shipment:${id}`,
  shipmentByTracking: (tracking) => `shipment:tracking:${tracking}`,
  
  // Driver-related
  driverAssignments: (driverId) => `driver:${driverId}:assignments`,
  activeDrivers: (country) => `drivers:active:${country}`,
  
  // Stats (cache for a short time)
  dashboardStats: () => 'stats:dashboard',
  userStats: (userId) => `stats:user:${userId}`,
};

module.exports = {
  cache,
  cacheKeys,
};
