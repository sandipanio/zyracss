/**
 * API module - Tree-shakable exports for optimal bundle size
 * Each export can be imported individually to minimize bundle size
 */

// ============================================================================
// CORE API - Most commonly used functions
// ============================================================================

// Primary CSS generation function
export { generateCSS } from "./core/generateCSS.js";

// ============================================================================
// CONVENIENCE METHODS - Tree-shakable utilities
// ============================================================================

// Individual convenience methods for optimal tree-shaking
export { generateCSSFromHTML } from "./utilities/convenienceMethods.js";
export { generateCSSFromClasses } from "./utilities/convenienceMethods.js";
export { validateClassNames } from "./utilities/convenienceMethods.js";
export { validateSingleClass } from "./utilities/convenienceMethods.js";
export { getValidationStats } from "./utilities/convenienceMethods.js";

// ============================================================================
// VALIDATION MODULES - For advanced usage
// ============================================================================

export { validateGenerateInput } from "./validators/inputValidator.js";
export { validateClassesInput } from "./validators/inputValidator.js";
export { validateHTMLInput } from "./validators/inputValidator.js";
export { performSecurityValidation } from "./validators/securityValidator.js";

// ============================================================================
// PROCESSING MODULES - For custom workflows
// ============================================================================

export { processClassesInput } from "./processors/classCollector.js";
export { collectAllClasses } from "./processors/classCollector.js";
export { processHTMLInput } from "./processors/htmlProcessor.js";
export { processClassInput } from "./processors/classProcessor.js";

// ============================================================================
// ENGINE & ORCHESTRATION - For advanced integrations
// ============================================================================

export { createEngine } from "./core/createEngine.js";
export { generateCSSFromValidatedClasses } from "./core/cssOrchestrator.js";
export { compileFinalResult } from "./core/cssOrchestrator.js";

// ============================================================================
// ERROR HANDLING - For robust error management
// ============================================================================

export { createErrorResponse } from "./utilities/errorHandler.js";
export { handleValidationError } from "./utilities/errorHandler.js";
export { handleParsingError } from "./utilities/errorHandler.js";
export { withErrorHandling } from "./utilities/errorHandler.js";

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
