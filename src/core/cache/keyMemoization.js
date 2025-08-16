/**
 * Cache Key Memoization System - Hot Path Optimization
 * Provides advanced memoization for frequently accessed cache keys
 */

import { createHash } from "crypto";

/**
 * High-performance memoized cache key generator
 * Optimizes the most frequently used key generation operations
 */
export class MemoizedKeyGenerator {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 10000;
    this.evictionSize = options.evictionSize || 2000; // How many to evict at once

    // Separate caches for different key types
    this.parseKeyCache = new Map();
    this.generationKeyCache = new Map();
    this.ruleKeyCache = new Map();
    this.hashCache = new Map();

    // Track access frequency for intelligent eviction
    this.accessFrequency = new Map();
    this.accessCounter = 0;

    // Performance metrics
    this.stats = {
      parseKeyHits: 0,
      parseKeyMisses: 0,
      generationKeyHits: 0,
      generationKeyMisses: 0,
      ruleKeyHits: 0,
      ruleKeyMisses: 0,
      hashHits: 0,
      hashMisses: 0,
      evictions: 0,
      totalOperations: 0,
    };
  }

  /**
   * Generate memoized parse key for class names
   * @param {string} className - Class name to generate key for
   * @returns {string} Cached or generated parse key
   */
  getParseKey(className) {
    this.stats.totalOperations++;

    // Fast path: Check cache first
    if (this.parseKeyCache.has(className)) {
      this.stats.parseKeyHits++;
      this.trackAccess(className, "parse");
      return this.parseKeyCache.get(className);
    }

    // Generate key
    this.stats.parseKeyMisses++;
    const key = `parse:${className}`;

    // Cache with eviction management
    this.setWithEviction(this.parseKeyCache, className, key, "parse");

    return key;
  }

  /**
   * Generate memoized generation key for class arrays and options
   * @param {Array} classArray - Array of class names
   * @param {Object} options - Generation options
   * @returns {string} Cached or generated generation key
   */
  getGenerationKey(classArray, options = {}) {
    this.stats.totalOperations++;

    // Create normalized input for consistent caching
    const sortedClasses = [...classArray].sort();
    const normalizedOptions = this.normalizeOptions(options);
    const inputKey = `${sortedClasses.join("|")}::${JSON.stringify(normalizedOptions)}`;

    // Fast path: Check cache first
    if (this.generationKeyCache.has(inputKey)) {
      this.stats.generationKeyHits++;
      this.trackAccess(inputKey, "generation");
      return this.generationKeyCache.get(inputKey);
    }

    // Generate key with optimized hashing
    this.stats.generationKeyMisses++;
    const classesHash = this.getMemoizedHash(sortedClasses.join("|"));
    const optionsHash = this.getMemoizedHash(JSON.stringify(normalizedOptions));
    const key = `gen:${classesHash}:${optionsHash}`;

    // Cache with eviction management
    this.setWithEviction(this.generationKeyCache, inputKey, key, "generation");

    return key;
  }

  /**
   * Generate memoized rule key for selectors and declarations
   * @param {string} selector - CSS selector
   * @param {Object|string} declarations - CSS declarations
   * @returns {string} Cached or generated rule key
   */
  getRuleKey(selector, declarations) {
    this.stats.totalOperations++;

    // Create normalized declaration string
    const normalizedDeclarations = this.normalizeDeclarations(declarations);
    const inputKey = `${selector}::${normalizedDeclarations}`;

    // Fast path: Check cache first
    if (this.ruleKeyCache.has(inputKey)) {
      this.stats.ruleKeyHits++;
      this.trackAccess(inputKey, "rule");
      return this.ruleKeyCache.get(inputKey);
    }

    // Generate key
    this.stats.ruleKeyMisses++;
    const declarationHash = this.getMemoizedHash(normalizedDeclarations);
    const key = `rule:${selector}:${declarationHash}`;

    // Cache with eviction management
    this.setWithEviction(this.ruleKeyCache, inputKey, key, "rule");

    return key;
  }

  /**
   * Get memoized hash for strings - optimizes repeated hash operations
   * @param {string} input - String to hash
   * @returns {string} Cached or generated hash
   */
  getMemoizedHash(input) {
    // Fast path: Check cache first
    if (this.hashCache.has(input)) {
      this.stats.hashHits++;
      this.trackAccess(input, "hash");
      return this.hashCache.get(input);
    }

    // Generate hash
    this.stats.hashMisses++;
    const hash = createHash("md5").update(input).digest("hex").substring(0, 8);

    // Cache with eviction management
    this.setWithEviction(this.hashCache, input, hash, "hash");

    return hash;
  }

  /**
   * Set cache entry with intelligent eviction when needed
   * @param {Map} cache - Target cache
   * @param {string} key - Cache key
   * @param {*} value - Cache value
   * @param {string} type - Cache type for stats
   */
  setWithEviction(cache, key, value, type) {
    // Check if eviction is needed
    if (cache.size >= this.maxSize) {
      this.evictLeastUsed(cache, type);
      this.stats.evictions++;
    }

    cache.set(key, value);
    this.trackAccess(key, type);
  }

  /**
   * Track access frequency for intelligent eviction
   * @param {string} key - Accessed key
   * @param {string} type - Access type
   */
  trackAccess(key, type) {
    this.accessCounter++;
    const accessKey = `${type}:${key}`;
    const current = this.accessFrequency.get(accessKey) || 0;
    this.accessFrequency.set(accessKey, current + 1);
  }

  /**
   * Evict least frequently used entries
   * @param {Map} cache - Cache to evict from
   * @param {string} type - Cache type
   */
  evictLeastUsed(cache, type) {
    const entries = Array.from(cache.keys());

    // Sort by access frequency (least used first)
    entries.sort((a, b) => {
      const freqA = this.accessFrequency.get(`${type}:${a}`) || 0;
      const freqB = this.accessFrequency.get(`${type}:${b}`) || 0;
      return freqA - freqB;
    });

    // Remove least used entries
    const toRemove = Math.min(this.evictionSize, entries.length);
    for (let i = 0; i < toRemove; i++) {
      const key = entries[i];
      cache.delete(key);
      this.accessFrequency.delete(`${type}:${key}`);
    }
  }

  /**
   * Normalize options object for consistent caching
   * @param {Object} options - Options to normalize
   * @returns {Object} Normalized options
   */
  normalizeOptions(options) {
    return {
      minify: Boolean(options.minify),
      groupSelectors: options.groupSelectors !== false,
      includeComments: Boolean(options.includeComments),
      // Add other commonly used options
      important: Boolean(options.important),
      scope: options.scope || null,
    };
  }

  /**
   * Normalize CSS declarations for consistent caching
   * @param {Object|string} declarations - Declarations to normalize
   * @returns {string} Normalized declaration string
   */
  normalizeDeclarations(declarations) {
    if (typeof declarations === "string") {
      return declarations.trim();
    }

    return Object.entries(declarations)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([prop, val]) => `${prop}:${val}`)
      .join(";");
  }

  /**
   * Get detailed performance statistics
   * @returns {Object} Performance stats
   */
  getStats() {
    const totalHits =
      this.stats.parseKeyHits +
      this.stats.generationKeyHits +
      this.stats.ruleKeyHits +
      this.stats.hashHits;
    const totalMisses =
      this.stats.parseKeyMisses +
      this.stats.generationKeyMisses +
      this.stats.ruleKeyMisses +
      this.stats.hashMisses;
    const totalRequests = totalHits + totalMisses;

    return {
      ...this.stats,
      totalRequests,
      overallHitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      parseKeyHitRate:
        this.stats.parseKeyHits + this.stats.parseKeyMisses > 0
          ? this.stats.parseKeyHits /
            (this.stats.parseKeyHits + this.stats.parseKeyMisses)
          : 0,
      generationKeyHitRate:
        this.stats.generationKeyHits + this.stats.generationKeyMisses > 0
          ? this.stats.generationKeyHits /
            (this.stats.generationKeyHits + this.stats.generationKeyMisses)
          : 0,
      ruleKeyHitRate:
        this.stats.ruleKeyHits + this.stats.ruleKeyMisses > 0
          ? this.stats.ruleKeyHits /
            (this.stats.ruleKeyHits + this.stats.ruleKeyMisses)
          : 0,
      hashHitRate:
        this.stats.hashHits + this.stats.hashMisses > 0
          ? this.stats.hashHits / (this.stats.hashHits + this.stats.hashMisses)
          : 0,
      cacheUtilization: {
        parseKeys: this.parseKeyCache.size,
        generationKeys: this.generationKeyCache.size,
        ruleKeys: this.ruleKeyCache.size,
        hashes: this.hashCache.size,
        accessFrequency: this.accessFrequency.size,
      },
      averageAccessesPerKey:
        this.accessFrequency.size > 0
          ? this.accessCounter / this.accessFrequency.size
          : 0,
      // Backward compatibility aliases
      hitRate: totalRequests > 0 ? totalHits / totalRequests : 0,
      cacheSize:
        this.parseKeyCache.size +
        this.generationKeyCache.size +
        this.ruleKeyCache.size +
        this.hashCache.size,
      memoryUsage: this.getMemoryUsage(),
    };
  }

  /**
   * Clear all caches and reset stats
   */
  clear() {
    this.parseKeyCache.clear();
    this.generationKeyCache.clear();
    this.ruleKeyCache.clear();
    this.hashCache.clear();
    this.accessFrequency.clear();
    this.accessCounter = 0;

    // Reset stats
    Object.keys(this.stats).forEach((key) => {
      this.stats[key] = 0;
    });
  }

  /**
   * Optimize caches by removing low-frequency entries
   */
  optimize() {
    const minAccessThreshold = Math.max(
      1,
      this.accessCounter / (this.accessFrequency.size * 10)
    );

    // Remove low-frequency entries from all caches
    for (const [accessKey, frequency] of this.accessFrequency) {
      if (frequency < minAccessThreshold) {
        const [type, ...keyParts] = accessKey.split(":");
        const key = keyParts.join(":");

        switch (type) {
          case "parse":
            this.parseKeyCache.delete(key);
            break;
          case "generation":
            this.generationKeyCache.delete(key);
            break;
          case "rule":
            this.ruleKeyCache.delete(key);
            break;
          case "hash":
            this.hashCache.delete(key);
            break;
        }

        this.accessFrequency.delete(accessKey);
      }
    }
  }

  /**
   * Get memory usage estimate
   * @returns {number} Estimated memory usage in bytes
   */
  getMemoryUsage() {
    const estimateMapSize = (map) => {
      let size = 0;
      for (const [key, value] of map) {
        size += (key.length + String(value).length) * 2; // UTF-16 estimation
      }
      return size;
    };

    return (
      estimateMapSize(this.parseKeyCache) +
      estimateMapSize(this.generationKeyCache) +
      estimateMapSize(this.ruleKeyCache) +
      estimateMapSize(this.hashCache) +
      estimateMapSize(this.accessFrequency)
    );
  }
}

/**
 * Global memoized key generator instance
 */
export const globalKeyGenerator = new MemoizedKeyGenerator({
  maxSize: 10000,
  evictionSize: 2000,
});

/**
 * Convenience functions for hot path optimization
 */
export function getMemoizedParseKey(className) {
  return globalKeyGenerator.getParseKey(className);
}

export function getMemoizedGenerationKey(classArray, options) {
  return globalKeyGenerator.getGenerationKey(classArray, options);
}

export function getMemoizedRuleKey(selector, declarations) {
  return globalKeyGenerator.getRuleKey(selector, declarations);
}

export function getMemoizedHash(input) {
  return globalKeyGenerator.getMemoizedHash(input);
}

/**
 * Get memoization performance stats
 */
export function getKeyMemoizationStats() {
  return globalKeyGenerator.getStats();
}
