/**
 * Job Queue Service
 * Handles async background tasks using Bull (Redis-backed)
 * Falls back to immediate execution when Redis is unavailable
 */

const Queue = require('bull');
const { isRedisConnected } = require('../config/redis');
const logger = require('./logger');

// Queue instances
const queues = {};

// Queue configuration
const defaultOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 50,      // Keep last 50 failed jobs
};

/**
 * Initialize a job queue
 * @param {string} name - Queue name
 * @param {Function} processor - Job processor function
 * @param {Object} options - Queue options
 * @returns {Queue|null} Queue instance or null
 */
const createQueue = (name, processor, options = {}) => {
  // Skip if no Redis
  if (!process.env.REDIS_URL) {
    logger.info(`Queue "${name}" skipped - Redis not configured`);
    return null;
  }

  try {
    const queue = new Queue(name, process.env.REDIS_URL, {
      defaultJobOptions: { ...defaultOptions, ...options },
    });

    // Process jobs
    queue.process(async (job) => {
      logger.info(`Processing job ${job.id} in queue "${name}"`);
      return processor(job.data, job);
    });

    // Event handlers
    queue.on('completed', (job, result) => {
      logger.info(`Job ${job.id} completed in queue "${name}"`);
    });

    queue.on('failed', (job, err) => {
      logger.error(`Job ${job.id} failed in queue "${name}":`, err.message);
    });

    queue.on('error', (err) => {
      logger.error(`Queue "${name}" error:`, err.message);
    });

    queues[name] = queue;
    logger.info(`✅ Queue "${name}" initialized`);
    return queue;
  } catch (error) {
    logger.error(`Failed to create queue "${name}":`, error.message);
    return null;
  }
};

/**
 * Add a job to a queue
 * Falls back to immediate execution if queue is unavailable
 * @param {string} queueName - Queue name
 * @param {Object} data - Job data
 * @param {Object} options - Job options
 * @returns {Promise<Object>} Job info
 */
const addJob = async (queueName, data, options = {}) => {
  const queue = queues[queueName];

  // If queue exists and Redis is available, use queue
  if (queue && isRedisConnected()) {
    const job = await queue.add(data, options);
    return { queued: true, jobId: job.id };
  }

  // Fallback: execute immediately (for development/testing)
  logger.warn(`Queue "${queueName}" unavailable - executing job immediately`);
  
  // Get the processor for this queue type
  const processor = queueProcessors[queueName];
  if (processor) {
    try {
      await processor(data);
      return { queued: false, executed: true };
    } catch (error) {
      logger.error(`Immediate job execution failed:`, error.message);
      return { queued: false, executed: false, error: error.message };
    }
  }

  return { queued: false, executed: false, error: 'No processor found' };
};

/**
 * Get queue stats
 * @param {string} queueName - Queue name
 * @returns {Promise<Object>} Queue statistics
 */
const getQueueStats = async (queueName) => {
  const queue = queues[queueName];
  if (!queue) {
    return { available: false };
  }

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount(),
  ]);

  return { available: true, waiting, active, completed, failed };
};

/**
 * Close all queues gracefully
 */
const closeQueues = async () => {
  for (const [name, queue] of Object.entries(queues)) {
    await queue.close();
    logger.info(`Queue "${name}" closed`);
  }
};

// =====================
// Queue Processors (define actual job handlers)
// =====================
const queueProcessors = {};

/**
 * Register a processor for a queue
 * @param {string} queueName - Queue name
 * @param {Function} processor - Processor function
 */
const registerProcessor = (queueName, processor) => {
  queueProcessors[queueName] = processor;
};

// =====================
// Pre-defined Queue Types
// =====================

const QUEUE_NAMES = {
  NOTIFICATIONS: 'notifications',
  EMAILS: 'emails',
  STATUS_UPDATES: 'status-updates',
  REPORTS: 'reports',
};

module.exports = {
  createQueue,
  addJob,
  getQueueStats,
  closeQueues,
  registerProcessor,
  QUEUE_NAMES,
};
