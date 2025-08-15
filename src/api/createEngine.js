/**
 * Incremental CSS generation engine for real-time editing
 * Maintains state for live updates and progressive CSS building
 */

import { parseClasses } from "../core/parser/index.js";
import { extractClassesFromHTML } from "../core/parser/htmlExtractor.js";
import { generateCSS as generateCSSCore } from "../core/generator/index.js";
import { validateClasses } from "../core/validators/index.js";
import { sanitizeInputArray } from "../core/security/index.js";
import { createLogger, now } from "../core/utils/index.js";
import { getVersion } from "../core/utils/version.js";

const logger = createLogger("Engine");

/**
 * Create a ZyraCSS engine for incremental CSS generation
 * Perfect for real-time editing, live previews, and AI-driven style updates
 *
 * @param {Object} options - Engine configuration options
 * @returns {Object} Engine instance with methods for incremental updates
 */
export function createEngine(options = {}) {
  const {
    minify = false,
    groupSelectors = true,
    includeComments = false,
    autoUpdate = true,
    maxClasses = 10000,
    cacheEnabled = true,
  } = options;

  // Engine state
  let allClasses = new Set();
  let cachedCSS = null;
  let lastUpdateTime = 0;
  let parseCache = new Map();
  let updateCount = 0;

  // Performance tracking
  const stats = {
    totalUpdates: 0,
    totalClasses: 0,
    cacheHits: 0,
    cacheMisses: 0,
    lastGenerationTime: 0,
    averageGenerationTime: 0,
  };

  /**
   * Add classes to the engine
   * @param {Array<string>} classes - Array of utility class names
   * @returns {Object} Update result with success status
   */
  function addClasses(classes) {
    if (!Array.isArray(classes)) {
      logger.warn("addClasses expects an array of strings");
      return { success: false, added: 0, invalid: ["Input must be an array"] };
    }

    const startTime = now();
    const initialSize = allClasses.size;

    // Sanitize and validate new classes
    const { sanitized, failed } = sanitizeInputArray(classes);
    const validation = validateClasses(sanitized);

    // Track invalid classes
    const invalid = [...validation.invalid, ...failed];

    // Add valid classes to the set (Set automatically deduplicates)
    validation.valid.forEach((cls) => allClasses.add(cls));

    const addedCount = allClasses.size - initialSize;

    // Invalidate cache if new classes were added
    if (addedCount > 0) {
      invalidateCache();
    }

    stats.totalUpdates++;
    updateCount++;

    logger.debug(
      `Added ${addedCount} new classes (${validation.valid.length} total processed)`
    );

    return {
      success: true,
      added: addedCount,
      invalid,
      totalClasses: allClasses.size,
      processingTime: now() - startTime,
    };
  }

  /**
   * Add classes from HTML content
   * @param {string} html - HTML string to scan for classes
   * @returns {Object} Update result with extracted classes
   */
  function addFromHTML(html) {
    if (typeof html !== "string") {
      return { success: false, added: 0, invalid: ["HTML must be a string"] };
    }

    const extractedClasses = extractClassesFromHTML(html);
    const result = addClasses(extractedClasses);

    return {
      ...result,
      extractedClasses: extractedClasses.length,
      html: html.length,
    };
  }

  /**
   * Remove classes from the engine
   * @param {Array<string>} classes - Array of class names to remove
   * @returns {Object} Removal result
   */
  function removeClasses(classes) {
    if (!Array.isArray(classes)) {
      return {
        success: false,
        removed: 0,
        invalid: ["Input must be an array"],
      };
    }

    const initialSize = allClasses.size;

    classes.forEach((cls) => {
      if (typeof cls === "string") {
        allClasses.delete(cls);
      }
    });

    const removedCount = initialSize - allClasses.size;

    if (removedCount > 0) {
      invalidateCache();
      updateCount++;
    }

    return {
      success: true,
      removed: removedCount,
      totalClasses: allClasses.size,
    };
  }

  /**
   * Check if a class exists in the engine
   * @param {string} className - Class name to check
   * @returns {boolean} True if class exists
   */
  function hasClass(className) {
    return allClasses.has(className);
  }

  /**
   * Get all classes currently in the engine
   * @returns {Array<string>} Array of all classes
   */
  function getAllClasses() {
    return Array.from(allClasses);
  }

  /**
   * Clear all classes from the engine
   * @returns {Object} Clear result
   */
  function clear() {
    const previousCount = allClasses.size;
    allClasses.clear();
    invalidateCache();
    updateCount++;

    return {
      success: true,
      clearedCount: previousCount,
      totalClasses: 0,
    };
  }

  /**
   * Generate CSS from current classes
   * @param {Object} generationOptions - Override generation options
   * @returns {Object} Generated CSS and metadata
   */
  function getCSS(generationOptions = {}) {
    const startTime = now();

    // Use cached CSS if available and no updates occurred
    if (cacheEnabled && cachedCSS && updateCount === 0) {
      stats.cacheHits++;
      return {
        ...cachedCSS,
        fromCache: true,
        processingTime: 0,
      };
    }

    stats.cacheMisses++;

    if (allClasses.size === 0) {
      const emptyResult = {
        css: "",
        classes: [],
        stats: {
          totalClasses: 0,
          generatedRules: 0,
          processingTime: 0,
        },
        fromCache: false,
      };

      if (cacheEnabled) {
        cachedCSS = emptyResult;
        updateCount = 0;
      }

      return emptyResult;
    }

    // Merge options
    const finalOptions = {
      minify,
      groupSelectors,
      includeComments,
      ...generationOptions,
    };

    try {
      // Convert Set to Array for processing
      const classArray = Array.from(allClasses);

      // Parse classes (with caching for performance)
      const parsedClasses = [];
      for (const className of classArray) {
        if (parseCache.has(className)) {
          parsedClasses.push(parseCache.get(className));
        } else {
          // Parse new class
          const parsed = parseClasses([className]);
          if (parsed.length > 0) {
            parseCache.set(className, parsed[0]);
            parsedClasses.push(parsed[0]);
          }
        }
      }

      // Generate CSS
      const result = generateCSSCore(parsedClasses, finalOptions);
      const processingTime = now() - startTime;

      const finalResult = {
        css: result.css,
        classes: classArray,
        stats: {
          totalClasses: allClasses.size,
          generatedRules: result.stats.totalRules || 0,
          groupedRules: result.stats.groupedRules || 0,
          compressionRatio: result.stats.compressionRatio || 1,
          processingTime: Math.round(processingTime * 100) / 100,
        },
        fromCache: false,
      };

      // Update performance stats
      stats.lastGenerationTime = processingTime;
      stats.averageGenerationTime =
        (stats.averageGenerationTime * stats.totalUpdates + processingTime) /
        (stats.totalUpdates + 1);

      // Cache the result
      if (cacheEnabled) {
        cachedCSS = finalResult;
        updateCount = 0;
      }

      return finalResult;
    } catch (error) {
      logger.error("CSS generation failed:", error.message);

      return {
        css: "",
        classes: Array.from(allClasses),
        error: error.message,
        stats: {
          totalClasses: allClasses.size,
          generatedRules: 0,
          processingTime: now() - startTime,
        },
        fromCache: false,
      };
    }
  }

  /**
   * Get current engine statistics
   * @returns {Object} Engine performance and usage statistics
   */
  function getStats() {
    return {
      ...stats,
      totalClasses: allClasses.size,
      cacheSize: parseCache.size,
      updateCount,
      cacheHitRate:
        stats.cacheHits / (stats.cacheHits + stats.cacheMisses) || 0,
      uptime: now() - lastUpdateTime,
    };
  }

  /**
   * Update engine options
   * @param {Object} newOptions - New options to merge
   * @returns {Object} Updated options
   */
  function updateOptions(newOptions) {
    Object.assign(options, newOptions);
    invalidateCache(); // Options change might affect output

    return { ...options };
  }

  /**
   * Invalidate internal caches
   * @private
   */
  function invalidateCache() {
    cachedCSS = null;
    lastUpdateTime = now();

    // Limit parse cache size to prevent memory leaks
    if (parseCache.size > maxClasses) {
      // Clear oldest entries (simple LRU approximation)
      const entries = Array.from(parseCache.entries());
      parseCache.clear();
      // Keep the most recently added half
      entries.slice(-Math.floor(maxClasses / 2)).forEach(([key, value]) => {
        parseCache.set(key, value);
      });
    }
  }

  /**
   * Export current state for serialization/persistence
   * @returns {Object} Serializable engine state
   */
  function exportState() {
    return {
      classes: Array.from(allClasses),
      options: { ...options },
      stats: { ...stats },
      timestamp: now(),
    };
  }

  /**
   * Import state from exported data
   * @param {Object} state - Previously exported state
   * @returns {Object} Import result
   */
  function importState(state) {
    if (!state || !Array.isArray(state.classes)) {
      return { success: false, error: "Invalid state format" };
    }

    clear();
    const result = addClasses(state.classes);

    if (state.options) {
      updateOptions(state.options);
    }

    return {
      success: true,
      imported: result.added,
      totalClasses: allClasses.size,
    };
  }

  // Initialize
  lastUpdateTime = now();

  // Return the engine instance
  return {
    // Core methods
    addClasses,
    addFromHTML,
    removeClasses,
    hasClass,
    getAllClasses,
    clear,
    getCSS,

    // Management methods
    getStats,
    updateOptions,
    exportState,
    importState,

    // Properties
    get size() {
      return allClasses.size;
    },

    get options() {
      return { ...options };
    },

    // Engine metadata
    get type() {
      return "ZyraCSS-Engine";
    },

    get version() {
      return getVersion();
    },
  };
}
