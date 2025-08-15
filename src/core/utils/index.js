/**
 * Utils module - Main coordination for utility functions
 * Provides centralized access to all utility functions
 */

// CSS utilities
export {
  escapeCSSSelector,
  normalizePropertyName,
  isValidCSSIdentifier,
  parseShorthandValue,
  normalizeCSSValue,
  isCSSLength,
  isCSSColor,
  generateCSSRule,
} from "./cssUtils.js";

// String utilities
export {
  safeTrim,
  splitByDelimiters,
  escapeRegExp,
  camelToKebab,
  kebabToCamel,
  truncate,
  countOccurrences,
  containsOnly,
  normalizeWhitespace,
  extractWords,
  isBlank,
  padString,
} from "./stringUtils.js";

// Constants
export {
  CSS_UNITS,
  PROPERTY_CATEGORIES,
  DEFAULT_CONFIG,
  PERFORMANCE_THRESHOLDS,
  FILE_PATTERNS,
  VALUE_TYPES,
  CSS_KEYWORDS,
  ERROR_CODES,
  SUCCESS_MESSAGES,
  RESPONSE_FORMATS,
  VERSION_INFO,
  FEATURE_FLAGS,
  DEBUG_LEVELS,
} from "./constants.js";

// Helper functions
export { createLogger, formatPerformanceStats } from "./helpers.js";

/**
 * Portable high-resolution timer
 * Works in Node.js, browsers, and test environments
 * @returns {number} Current time in milliseconds
 */
export const now =
  (globalThis.performance &&
    globalThis.performance.now.bind(globalThis.performance)) ||
  (() => Date.now());

/**
 * Get current ZyraCSS version
 * @returns {string} Version string
 */
export function getVersion() {
  return VERSION_INFO.FULL;
}

/**
 * Check if a feature flag is enabled
 * @param {string} feature - Feature name
 * @returns {boolean} True if feature is enabled
 */
export function isFeatureEnabled(feature) {
  return FEATURE_FLAGS[feature] === true;
}

/**
 * Create performance timer with portable timing
 * @param {string} name - Timer name
 * @returns {Object} Timer object with start/stop methods
 */
export function createTimer(name = "timer") {
  let startTime = null;

  return {
    start() {
      startTime = now();
    },

    stop() {
      if (startTime === null) {
        return 0;
      }

      const elapsed = now() - startTime;
      startTime = null;
      return Math.round(elapsed * 100) / 100; // Round to 2 decimal places
    },

    isRunning() {
      return startTime !== null;
    },
  };
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {...Object} sources - Source objects to merge
 * @returns {Object} Merged object
 */
export function deepMerge(target, ...sources) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        deepMerge(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return deepMerge(target, ...sources);
}

/**
 * Check if value is an object
 * @param {any} item - Item to check
 * @returns {boolean} True if item is an object
 */
function isObject(item) {
  return item && typeof item === "object" && !Array.isArray(item);
}
