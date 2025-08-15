/**
 * Cache System - Main Index with Clean Exports
 * Provides multi-layer caching for ZyraCSS performance optimization
 */

import { createHash } from "crypto";
import { now } from "../utils/index.js";

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONFIG = {
  maxParseCache: 5000,
  maxGenerationCache: 1000,
  maxRuleCache: 10000,
  ttl: 1000 * 60 * 60, // 1 hour default TTL
  optimizeInterval: 1000 * 60 * 30, // 30 minutes
};

// ============================================================================
// LRU CACHE IMPLEMENTATION
// ============================================================================

class LRUCache {
  constructor(maxSize = 1000, ttl = 1000 * 60 * 60) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.cache = new Map();
    this.accessOrder = new Map();
  }

  set(key, value) {
    const now = Date.now();

    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

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

    // Update access tracking
    entry.accessCount++;
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
  }

  get size() {
    return this.cache.size;
  }

  evictLRU() {
    if (this.accessOrder.size === 0) return;

    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, accessTime] of this.accessOrder) {
      if (accessTime < oldestTime) {
        oldestTime = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
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
  // CACHE KEY GENERATION
  // ============================================================================

  createParseKey(className) {
    return `parse:${className}`;
  }

  createGenerationKey(classArray, options) {
    // Sort classes for consistent key regardless of input order
    const sortedClasses = [...classArray].sort();

    // Create stable options hash
    const optionsHash = this.hashObject({
      minify: options.minify || false,
      groupSelectors: options.groupSelectors !== false,
      includeComments: options.includeComments || false,
    });

    // Create combined hash
    const classesHash = createHash("md5")
      .update(sortedClasses.join("|"))
      .digest("hex");

    return `gen:${classesHash}:${optionsHash}`;
  }

  createRuleKey(selector, declarations) {
    const declarationString =
      typeof declarations === "string"
        ? declarations
        : Object.entries(declarations)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([prop, val]) => `${prop}:${val}`)
            .join(";");

    return `rule:${selector}:${this.hashString(declarationString)}`;
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
    return {
      ...this.stats,
      parseSize: this.parseCache.size,
      generationSize: this.generationCache.size,
      ruleSize: this.ruleCache.size,
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
    const maxAge = 1000 * 60 * 30; // 30 minutes

    [this.parseCache, this.generationCache, this.ruleCache].forEach((cache) => {
      cache.removeExpired(now - maxAge);
    });
  }

  setupAutoOptimization(interval) {
    if (typeof setInterval !== "undefined") {
      setInterval(() => {
        this.optimize();
      }, interval);
    }
  }
}

// ============================================================================
// GLOBAL CACHE INSTANCE
// ============================================================================

export const globalCache = new ZyraCacheSystem({
  maxParseCache: 5000,
  maxGenerationCache: 1000,
  maxRuleCache: 10000,
  ttl: 1000 * 60 * 60, // 1 hour
});

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
