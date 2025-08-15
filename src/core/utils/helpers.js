/**
 * General helper functions
 * Utility functions used across different modules
 */

import { DEBUG_LEVELS } from "./constants.js";

/**
 * Create a logger with different levels
 * @param {string} context - Context/module name for logging
 * @param {number} level - Minimum log level to output
 * @returns {Object} Logger object
 */
export function createLogger(context = "ZyraCSS", level = DEBUG_LEVELS.WARN) {
  const log = (logLevel, message, ...args) => {
    if (logLevel <= level) {
      const timestamp = new Date().toISOString();
      const levelName = Object.keys(DEBUG_LEVELS)[logLevel] || "UNKNOWN";
      console.log(
        `[${timestamp}] [${levelName}] [${context}] ${message}`,
        ...args
      );
    }
  };

  return {
    error: (message, ...args) => log(DEBUG_LEVELS.ERROR, message, ...args),
    warn: (message, ...args) => log(DEBUG_LEVELS.WARN, message, ...args),
    info: (message, ...args) => log(DEBUG_LEVELS.INFO, message, ...args),
    debug: (message, ...args) => log(DEBUG_LEVELS.DEBUG, message, ...args),
    trace: (message, ...args) => log(DEBUG_LEVELS.TRACE, message, ...args),

    setLevel: (newLevel) => {
      level = newLevel;
    },
    getLevel: () => level,
  };
}

/**
 * Format performance statistics for display
 * @param {Object} stats - Performance statistics object
 * @returns {Object} Formatted statistics
 */
export function formatPerformanceStats(stats) {
  const formatted = { ...stats };

  // Format timing values
  if (typeof formatted.processingTime === "number") {
    formatted.processingTimeFormatted = `${formatted.processingTime}ms`;
  }

  // Format percentages
  if (typeof formatted.compressionRatio === "number") {
    formatted.compressionPercentage = `${(formatted.compressionRatio * 100).toFixed(1)}%`;
  }

  // Format memory usage if available
  if (typeof formatted.memoryUsage === "number") {
    formatted.memoryUsageFormatted = formatBytes(formatted.memoryUsage);
  }

  // Add performance rating
  if (typeof formatted.processingTime === "number") {
    formatted.performanceRating = getPerformanceRating(
      formatted.processingTime,
      formatted.totalClasses || 0
    );
  }

  return formatted;
}

/**
 * Format bytes to human readable format
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted byte string
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get performance rating based on processing time and input size
 * @param {number} time - Processing time in milliseconds
 * @param {number} classes - Number of classes processed
 * @returns {string} Performance rating
 */
function getPerformanceRating(time, classes) {
  const timePerClass = classes > 0 ? time / classes : time;

  if (timePerClass < 0.01) return "excellent";
  if (timePerClass < 0.1) return "good";
  if (timePerClass < 1) return "average";
  if (timePerClass < 10) return "slow";
  return "very-slow";
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;

  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function calls
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle;

  return function executedFunction(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Create a simple cache with LRU eviction
 * @param {number} maxSize - Maximum cache size
 * @returns {Object} Cache object
 */
export function createCache(maxSize = 1000) {
  const cache = new Map();

  return {
    get(key) {
      if (cache.has(key)) {
        // Move to end (most recently used)
        const value = cache.get(key);
        cache.delete(key);
        cache.set(key, value);
        return value;
      }
      return undefined;
    },

    set(key, value) {
      if (cache.has(key)) {
        cache.delete(key);
      } else if (cache.size >= maxSize) {
        // Remove least recently used (first item)
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },

    has(key) {
      return cache.has(key);
    },

    delete(key) {
      return cache.delete(key);
    },

    clear() {
      cache.clear();
    },

    size() {
      return cache.size;
    },

    stats() {
      return {
        size: cache.size,
        maxSize,
        usage: cache.size / maxSize,
      };
    },
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Initial delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
export async function retry(fn, maxRetries = 3, delay = 100) {
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise((resolve) =>
        setTimeout(resolve, delay * Math.pow(2, i))
      );
    }
  }
}

/**
 * Check if code is running in Node.js environment
 * @returns {boolean} True if running in Node.js
 */
export function isNode() {
  return (
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null
  );
}

/**
 * Check if code is running in browser environment
 * @returns {boolean} True if running in browser
 */
export function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * Generate unique ID
 * @param {string} prefix - Optional prefix
 * @returns {string} Unique ID
 */
export function generateId(prefix = "") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `${prefix}${timestamp}${random}`;
}
