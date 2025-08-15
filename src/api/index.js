/**
 * API module - Main coordination for the programmatic API
 * Clean re-exports and minimal coordination
 */

// Core API functions
export {
  generateCSS,
  generateCSSFromHTML,
  generateCSSFromClasses,
} from "./generateCSS.js";

// Incremental engine
export { createEngine } from "./createEngine.js";

// Convenience methods
export {
  generateMinifiedCSS,
  generateCSSWithDebug,
  validateClassNames,
  quickCSS,
  getCSSString,
  areValidClasses,
  estimateCSSSize,
  generateCSSWithProgress,
} from "./convenienceMethods.js";

// Input processors
export {
  processHTMLInput,
  validateHTMLContent,
  analyzeClassUsage,
  cleanHTML,
} from "./htmlProcessor.js";

export {
  processClassInput,
  analyzeClassArray,
  suggestOptimizations,
} from "./classProcessor.js";

// Error handling
export {
  createErrorResponse,
  handleValidationError,
  handleParsingError,
  handleSecurityError,
  handleGenerationError,
  handleInputError,
  handleRateLimitError,
  withErrorHandling,
  normalizeResponse,
  isSuccessResponse,
  extractError,
} from "./errorHandler.js";

/**
 * Create a ZyraCSS API instance with custom configuration
 * @param {Object} config - Configuration options
 * @returns {Object} Configured API instance
 */
export function createZyraAPI(config = {}) {
  const {
    defaultOptions = {},
    errorHandler = null,
    middleware = [],
    cache = null,
  } = config;

  // Create wrapped API methods with configuration
  const api = {
    async generateCSS(input) {
      const { generateCSS } = await import("./generateCSS.js");

      const mergedInput = {
        ...input,
        options: { ...defaultOptions, ...input.options },
      };

      try {
        let result = await generateCSS(mergedInput);

        // Apply middleware
        for (const middlewareFn of middleware) {
          result = await middlewareFn(result, mergedInput);
        }

        return result;
      } catch (error) {
        if (errorHandler) {
          return errorHandler(error, mergedInput);
        }
        throw error;
      }
    },

    async generateCSSFromHTML(html, options = {}) {
      return this.generateCSS({
        html: [html],
        options: { ...defaultOptions, ...options },
      });
    },

    async generateCSSFromClasses(classes, options = {}) {
      return this.generateCSS({
        classes,
        options: { ...defaultOptions, ...options },
      });
    },

    // Create engine with default options
    createEngine: (engineOptions = {}) => {
      const { createEngine } = require("./createEngine.js");
      return createEngine({ ...defaultOptions, ...engineOptions });
    },

    // Add other convenience methods
    quickCSS: async (classes, minify = true) => {
      const { quickCSS } = await import("./convenienceMethods.js");
      return quickCSS(classes, minify);
    },

    validateClassNames: async (classes) => {
      const { validateClassNames } = await import("./convenienceMethods.js");
      return validateClassNames(classes);
    },

    // Configuration methods
    getConfig: () => ({ ...config }),
    updateConfig: (newConfig) => Object.assign(config, newConfig),
  };

  return api;
}

/**
 * Default API instance with standard configuration
 */
export const zyracss = createZyraAPI({
  defaultOptions: {
    minify: false,
    groupSelectors: true,
    includeComments: false,
  },
});

/**
 * Get version information
 * @returns {Promise<Object>} Version information
 */
export async function getAPIVersion() {
  const { VERSION_INFO } = await import("../core/utils/constants.js");
  return {
    version: VERSION_INFO.FULL,
    api: "1.0.0",
    core: VERSION_INFO.FULL,
  };
}

/**
 * Health check for the API
 * @returns {Promise<Object>} Health status
 */
export async function healthCheck() {
  try {
    // Test basic functionality
    const { generateCSSFromClasses } = await import("./generateCSS.js");
    const testResult = await generateCSSFromClasses(["p-[1px]"]);

    return {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: (await getAPIVersion()).version,
      testPassed: testResult.css && testResult.css.includes("padding: 1px"),
      uptime: process.uptime ? process.uptime() : null,
    };
  } catch (error) {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime ? process.uptime() : null,
    };
  }
}
