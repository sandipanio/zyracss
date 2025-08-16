/**
 * Cache System - Main Index with Clean Exports
 * Provides multi-layer caching for ZyraCSS performance optimization with hot path memoization
 */

import { createHash } from "crypto";
import { now } from "../utils/essential.js";
import { CACHE_CONSTANTS } from "../utils/constants.js";
import {
  globalKeyGenerator,
  getMemoizedParseKey,
  getMemoizedGenerationKey,
  getMemoizedRuleKey,
  getMemoizedHash,
  getKeyMemoizationStats,
} from "./keyMemoization.js";

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  maxParseCache: CACHE_CONSTANTS.MAX_PARSE_CACHE,
  maxGenerationCache: CACHE_CONSTANTS.MAX_GENERATION_CACHE,
  maxRuleCache: CACHE_CONSTANTS.MAX_RULE_CACHE,
  ttl: CACHE_CONSTANTS.TTL_DEFAULT,
  optimizeInterval: CACHE_CONSTANTS.TTL_THIRTY_MINUTES,
};

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUCache {
  constructor(
    maxSize = CACHE_CONSTANTS.DEFAULT_CACHE_SIZE,
    ttl = CACHE_CONSTANTS.TTL_DEFAULT
  ) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    // Use Map for O(1) LRU tracking - insertion order = access order
    this.accessOrder = new Map();

    // Add cache key memoization for performance
    this.keyCache = new Map();
    this.keyCacheMaxSize = Math.min(
      CACHE_CONSTANTS.DEFAULT_CACHE_SIZE,
      maxSize / CACHE_CONSTANTS.KEY_CACHE_SIZE_DIVIDER
    );
  }
  set(key, value) {
    const now = Date.now();

    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    // Add new entry
    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1,
    });
    this.accessOrder.set(key, now);
  }

  get(key) {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check TTL
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      return null;
    }

    // Update access tracking efficiently
    entry.accessCount++;

    // Move to end of access order (most recently used)
    this.accessOrder.delete(key);
    this.accessOrder.set(key, now);

    return entry.value;
  }

  has(key) {
    return this.cache.has(key);
  }

  delete(key) {
    this.cache.delete(key);
    this.accessOrder.delete(key);
  }

  clear() {
    this.cache.clear();
    this.accessOrder.clear();
    // Also clear key cache to prevent memory leaks
    if (this.keyCache) {
      this.keyCache.clear();
    }
  }

  get size() {
    return this.cache.size;
  }

  evictLRU() {
    if (this.accessOrder.size === 0) return;

    // O(1) eviction: first entry in Map is least recently used
    const oldestKey = this.accessOrder.keys().next().value;

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);

      // Clean up key cache if it exists
      if (this.keyCache && this.keyCache.size > 0) {
        // Remove any cached keys that reference the evicted data
        for (const [cachedKey, cachedValue] of this.keyCache) {
          if (cachedValue === oldestKey) {
            this.keyCache.delete(cachedKey);
            break;
          }
        }
      }
    }
  }

  removeExpired(cutoffTime) {
    const toDelete = [];

    for (const [key, entry] of this.cache) {
      if (entry.timestamp < cutoffTime) {
        toDelete.push(key);
      }
    }

    toDelete.forEach((key) => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    });

    return toDelete.length;
  }

  getStats() {
    const now = Date.now();
    let totalAge = 0;
    let expiredCount = 0;

    for (const [, entry] of this.cache) {
      const age = now - entry.timestamp;
      totalAge += age;

      if (age > this.ttl) {
        expiredCount++;
      }
    }

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      averageAge: this.cache.size > 0 ? totalAge / this.cache.size : 0,
      expiredCount,
      utilizationRate: this.cache.size / this.maxSize,
    };
  }
}

// ============================================================================
// MAIN CACHE SYSTEM
// ============================================================================

export class ZyraCacheSystem {
  constructor(options = {}) {
    const config = { ...CACHE_CONFIG, ...options };

    // Multi-layer cache setup
    this.parseCache = new LRUCache(config.maxParseCache, config.ttl);
    this.generationCache = new LRUCache(config.maxGenerationCache, config.ttl);
    this.ruleCache = new LRUCache(config.maxRuleCache, config.ttl);

    // Performance statistics
    this.stats = {
      parseHits: 0,
      parseMisses: 0,
      generationHits: 0,
      generationMisses: 0,
      ruleHits: 0,
      ruleMisses: 0,
      totalEvictions: 0,
    };

    // Auto-optimization setup
    this.setupAutoOptimization(config.optimizeInterval);
  }

  // ============================================================================
  // PARSE CACHE METHODS
  // ============================================================================

  cacheParsedClass(className, parsedResult) {
    const key = this.createParseKey(className);
    this.parseCache.set(key, {
      className,
      parsedResult,
      timestamp: now(),
    });
  }

  getCachedParsedClass(className) {
    const key = this.createParseKey(className);
    const cached = this.parseCache.get(key);

    if (cached) {
      this.stats.parseHits++;
      return cached.parsedResult;
    }

    this.stats.parseMisses++;
    return null;
  }

  // ============================================================================
  // GENERATION CACHE METHODS (Most Important for Performance)
  // ============================================================================

  cacheGeneratedCSS(classArray, options, result) {
    const key = this.createGenerationKey(classArray, options);
    this.generationCache.set(key, {
      classArray: [...classArray],
      options: { ...options },
      result: {
        css: result.css,
        rules: result.rules,
        stats: result.stats,
      },
      timestamp: now(),
    });
  }

  getCachedGeneratedCSS(classArray, options) {
    const key = this.createGenerationKey(classArray, options);
    const cached = this.generationCache.get(key);

    if (cached) {
      this.stats.generationHits++;
      return {
        css: cached.result.css,
        rules: cached.result.rules,
        stats: {
          ...cached.result.stats,
          fromCache: true,
          cacheTimestamp: cached.timestamp,
        },
      };
    }

    this.stats.generationMisses++;
    return null;
  }

  // ============================================================================
  // RULE CACHE METHODS
  // ============================================================================

  cacheRule(selector, declarations, rule) {
    const key = this.createRuleKey(selector, declarations);
    this.ruleCache.set(key, {
      selector,
      declarations,
      rule,
      timestamp: now(),
    });
  }

  getCachedRule(selector, declarations) {
    const key = this.createRuleKey(selector, declarations);
    const cached = this.ruleCache.get(key);

    if (cached) {
      this.stats.ruleHits++;
      return cached.rule;
    }

    this.stats.ruleMisses++;
    return null;
  }

  // ============================================================================
  // OPTIMIZED CACHE KEY GENERATION WITH MEMOIZATION
  // ============================================================================

  createParseKey(className) {
    // Use memoized key generation for hot path optimization
    return getMemoizedParseKey(className);
  }

  createGenerationKey(classArray, options) {
    // Use memoized key generation for hot path optimization
    return getMemoizedGenerationKey(classArray, options);
  }

  createRuleKey(selector, declarations) {
    // Use memoized key generation for hot path optimization
    return getMemoizedRuleKey(selector, declarations);
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  hashObject(obj) {
    const str = JSON.stringify(obj, Object.keys(obj).sort());
    return this.hashString(str);
  }

  hashString(str) {
    return createHash("md5").update(str).digest("hex").substring(0, 8);
  }

  clear() {
    this.parseCache.clear();
    this.generationCache.clear();
    this.ruleCache.clear();

    Object.keys(this.stats).forEach((key) => {
      this.stats[key] = 0;
    });
  }

  getStats() {
    const keyMemoizationStats = getKeyMemoizationStats();

    return {
      // Core cache stats
      ...this.stats,
      parseSize: this.parseCache.size,
      generationSize: this.generationCache.size,
      ruleSize: this.ruleCache.size,

      // Nested cache objects for compatibility
      parseCache: {
        size: this.parseCache.size,
        hits: this.stats.parseHits,
        misses: this.stats.parseMisses,
        evictions: this.stats.parseEvictions || 0,
      },
      generationCache: {
        size: this.generationCache.size,
        hits: this.stats.generationHits,
        misses: this.stats.generationMisses,
        evictions: this.stats.generationEvictions || 0,
      },
      ruleCache: {
        size: this.ruleCache.size,
        hits: this.stats.ruleHits,
        misses: this.stats.ruleMisses,
        evictions: this.stats.ruleEvictions || 0,
      },

      parseHitRate:
        this.stats.parseHits /
          (this.stats.parseHits + this.stats.parseMisses) || 0,
      generationHitRate:
        this.stats.generationHits /
          (this.stats.generationHits + this.stats.generationMisses) || 0,
      ruleHitRate:
        this.stats.ruleHits / (this.stats.ruleHits + this.stats.ruleMisses) ||
        0,
      totalMemoryEstimate: this.estimateMemoryUsage(),

      // Memoization stats for hot path optimization
      keyMemoization: keyMemoizationStats,
      overallOptimizationRate: keyMemoizationStats.overallHitRate,
    };
  }

  estimateMemoryUsage() {
    return (
      (this.parseCache.size + this.generationCache.size + this.ruleCache.size) *
      1024
    );
  }

  optimize() {
    const now = Date.now();
    const maxAge = CACHE_CONSTANTS.TTL_THIRTY_MINUTES;

    // Optimize main caches
    [this.parseCache, this.generationCache, this.ruleCache].forEach((cache) => {
      cache.removeExpired(now - maxAge);
    });

    // Optimize key memoization system
    globalKeyGenerator.optimize();
  }

  setupAutoOptimization(interval) {
    if (typeof setInterval !== "undefined") {
      this.optimizationInterval = setInterval(() => {
        this.optimize();
      }, interval);
    }
  }

  /**
   * Clean up timers to allow process to exit cleanly
   */
  cleanup() {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }
  }
}

// ============================================================================
// GLOBAL CACHE INSTANCE
// ============================================================================

export const globalCache = new ZyraCacheSystem({
  maxParseCache: CACHE_CONSTANTS.MAX_PARSE_CACHE,
  maxGenerationCache: CACHE_CONSTANTS.MAX_GENERATION_CACHE,
  maxRuleCache: CACHE_CONSTANTS.MAX_RULE_CACHE,
  ttl: CACHE_CONSTANTS.TTL_DEFAULT,
});

/**
 * Cleanup global cache to allow process to exit cleanly
 */
export function cleanupGlobalCache() {
  globalCache.cleanup();
}

// ============================================================================
// CACHE WRAPPER FUNCTIONS
// ============================================================================

export function withParseCache(parseFunction) {
  return function cachedParse(className, ...args) {
    // Try cache first
    const cached = globalCache.getCachedParsedClass(className);
    if (cached) {
      return cached;
    }

    // Parse and cache result
    const result = parseFunction(className, ...args);
    if (result) {
      globalCache.cacheParsedClass(className, result);
    }

    return result;
  };
}

export function withGenerationCache(generateFunction) {
  return function cachedGenerate(classArray, options = {}, ...args) {
    // Try cache first
    const cached = globalCache.getCachedGeneratedCSS(classArray, options);
    if (cached) {
      return cached;
    }

    // Generate and cache result
    const result = generateFunction(classArray, options, ...args);
    if (result && result.css) {
      globalCache.cacheGeneratedCSS(classArray, options, result);
    }

    return result;
  };
}

export function withRuleCache(ruleFunction) {
  return function cachedRule(selector, declarations, ...args) {
    // Try cache first
    const cached = globalCache.getCachedRule(selector, declarations);
    if (cached) {
      return cached;
    }

    // Generate and cache result
    const result = ruleFunction(selector, declarations, ...args);
    if (result) {
      globalCache.cacheRule(selector, declarations, result);
    }

    return result;
  };
}

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export { LRUCache };
export { CACHE_CONFIG };

// Export key memoization functions for external use
export {
  getMemoizedParseKey,
  getMemoizedGenerationKey,
  getMemoizedRuleKey,
  getMemoizedHash,
  getKeyMemoizationStats,
  globalKeyGenerator,
};
