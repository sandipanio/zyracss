/**
 * ZyraCSS Utilities Index
 * Centralized access to all utility functions
 */

/**
 * Create performance timer with portable timing
 * @param {string} name - Timer name
 * @returns {Object} Timer object with start/stop methods
 */
export function createTimer(name = "timer") {
  let startTime = null;

  return {
    start() {
      startTime = Date.now();
      return this;
    },

    stop() {
      if (startTime === null) {
        return 0; // Return 0 instead of throwing error for robustness
      }
      const duration = Date.now() - startTime;
      startTime = null;
      return duration;
    },

    elapsed() {
      if (startTime === null) {
        return 0;
      }
      return Date.now() - startTime;
    },
  };
}

// CSS utilities
export {
  escapeCSSSelector,
  normalizeCSSValue,
  isCSSLength,
  isCSSColor,
  generateCSSRule,
} from "./cssUtils.js";

// Constants
export {
  CSS_UNITS,
  PROCESSING_CONSTANTS,
  CACHE_CONSTANTS,
  ERROR_CODES,
  VERSION_INFO,
  FEATURE_FLAGS,
  DEBUG_LEVELS,
} from "./constants.js";

// Helper functions
export { createLogger } from "./helpers.js";

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
