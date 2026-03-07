/**
 * Application Performance Monitoring (APM) Utilities
 * 
 * Provides performance tracking, metrics collection, and health monitoring.
 * Can be extended with external APM services (Datadog, New Relic, etc.)
 * 
 * Usage:
 * - Wrap async functions with apm.trackAsync('operationName', fn)
 * - Log custom metrics with apm.recordMetric('name', value)
 * - Get stats with apm.getStats()
 */

const EventEmitter = require('events');

class APM extends EventEmitter {
  constructor() {
    super();
    this.metrics = new Map();
    this.slowThreshold = 1000; // 1 second
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
    
    // Track response times
    this.responseTimes = [];
    this.maxResponseSamples = 1000;
  }

  /**
   * Track async operation performance
   * @param {string} name - Operation name
   * @param {Function} fn - Async function to track
   */
  async trackAsync(name, fn) {
    const start = process.hrtime.bigint();
    try {
      const result = await fn();
      const duration = Number(process.hrtime.bigint() - start) / 1e6; // ms
      this.recordTiming(name, duration);
      return result;
    } catch (error) {
      this.errorCount++;
      this.emit('error', { name, error });
      throw error;
    }
  }

  /**
   * Record timing for an operation
   * @param {string} name - Operation name
   * @param {number} duration - Duration in milliseconds
   */
  recordTiming(name, duration) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        slowCount: 0,
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    
    if (duration > this.slowThreshold) {
      metric.slowCount++;
      this.emit('slow', { name, duration });
    }

    // Store response time sample
    this.responseTimes.push(duration);
    if (this.responseTimes.length > this.maxResponseSamples) {
      this.responseTimes.shift();
    }
  }

  /**
   * Record a custom metric
   * @param {string} name - Metric name
   * @param {number} value - Metric value
   */
  recordMetric(name, value) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, {
        count: 0,
        total: 0,
        min: Infinity,
        max: 0,
        last: null,
      });
    }

    const metric = this.metrics.get(name);
    metric.count++;
    metric.total += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.last = value;
  }

  /**
   * Increment request counter
   */
  incrementRequests() {
    this.requestCount++;
  }

  /**
   * Increment error counter
   */
  incrementErrors() {
    this.errorCount++;
  }

  /**
   * Get percentile from response times
   * @param {number} percentile - Percentile (e.g., 95, 99)
   */
  getPercentile(percentile) {
    if (this.responseTimes.length === 0) return 0;
    
    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Get comprehensive stats
   */
  getStats() {
    const uptime = (Date.now() - this.startTime) / 1000; // seconds
    const memoryUsage = process.memoryUsage();
    
    const operationStats = {};
    this.metrics.forEach((metric, name) => {
      operationStats[name] = {
        count: metric.count,
        avgTime: metric.totalTime ? (metric.totalTime / metric.count).toFixed(2) : 0,
        minTime: metric.minTime === Infinity ? 0 : metric.minTime.toFixed(2),
        maxTime: metric.maxTime.toFixed(2),
        slowCount: metric.slowCount || 0,
      };
    });

    return {
      uptime: `${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s`,
      uptimeSeconds: uptime,
      requests: {
        total: this.requestCount,
        perSecond: (this.requestCount / uptime).toFixed(2),
        errors: this.errorCount,
        errorRate: this.requestCount > 0 
          ? ((this.errorCount / this.requestCount) * 100).toFixed(2) + '%'
          : '0%',
      },
      responseTime: {
        avg: this.responseTimes.length > 0 
          ? (this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length).toFixed(2)
          : 0,
        p50: this.getPercentile(50).toFixed(2),
        p95: this.getPercentile(95).toFixed(2),
        p99: this.getPercentile(99).toFixed(2),
      },
      memory: {
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
      },
      operations: operationStats,
    };
  }

  /**
   * Express middleware for tracking requests
   */
  middleware() {
    return (req, res, next) => {
      const start = process.hrtime.bigint();
      this.incrementRequests();

      res.on('finish', () => {
        const duration = Number(process.hrtime.bigint() - start) / 1e6;
        const route = `${req.method} ${req.route?.path || req.path}`;
        this.recordTiming(route, duration);

        if (res.statusCode >= 400) {
          this.incrementErrors();
        }
      });

      next();
    };
  }

  /**
   * Reset all metrics
   */
  reset() {
    this.metrics.clear();
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.startTime = Date.now();
  }
}

// Singleton instance
const apm = new APM();

// Log slow operations in development
if (process.env.NODE_ENV !== 'production') {
  apm.on('slow', ({ name, duration }) => {
    console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
  });
}

module.exports = apm;
