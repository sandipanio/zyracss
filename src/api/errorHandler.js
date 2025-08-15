/**
 * API error handling and standardization
 * Provides consistent error handling across the API layer
 */

import { ERROR_CODES } from "../core/utils/constants.js";
import { createLogger } from "../core/utils/index.js";

const logger = createLogger("ErrorHandler");

/**
 * Create standardized error response
 * @param {string} code - Error code from ERROR_CODES
 * @param {string} message - Human-readable error message
 * @param {Object} details - Additional error details
 * @param {Object} context - Context information
 * @returns {Object} Standardized error response
 */
export function createErrorResponse(code, message, details = {}, context = {}) {
  const error = {
    success: false,
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      ...details,
    },
    css: "",
    invalid: [],
    stats: {
      totalInput: 0,
      validClasses: 0,
      invalidClasses: 0,
      generatedRules: 0,
      processingTime: 0,
      error: message,
    },
  };

  // Add context if provided
  if (Object.keys(context).length > 0) {
    error.error.context = context;
  }

  // Log error for debugging
  logger.error(`API Error [${code}]: ${message}`, { details, context });

  return error;
}

/**
 * Handle validation errors
 * @param {Array} invalidClasses - Array of invalid classes
 * @param {Object} context - Additional context
 * @returns {Object} Error response for validation failures
 */
export function handleValidationError(invalidClasses, context = {}) {
  const message = `Validation failed for ${invalidClasses.length} class(es)`;

  return createErrorResponse(
    ERROR_CODES.VALIDATION_FAILED,
    message,
    {
      invalidCount: invalidClasses.length,
      examples: invalidClasses.slice(0, 5), // Show first 5 examples
      hasMore: invalidClasses.length > 5,
    },
    context
  );
}

/**
 * Handle parsing errors
 * @param {Error} error - Original parsing error
 * @param {Object} context - Additional context
 * @returns {Object} Error response for parsing failures
 */
export function handleParsingError(error, context = {}) {
  const message = `Parsing failed: ${error.message}`;

  return createErrorResponse(
    ERROR_CODES.PARSING_FAILED,
    message,
    {
      originalError: error.message,
      stack: error.stack,
    },
    context
  );
}

/**
 * Handle security violations
 * @param {Array} threats - Array of security threats detected
 * @param {Object} context - Additional context
 * @returns {Object} Error response for security violations
 */
export function handleSecurityError(threats, context = {}) {
  const message = `Security violation detected: ${threats.length} threat(s) found`;

  return createErrorResponse(
    ERROR_CODES.SECURITY_VIOLATION,
    message,
    {
      threatCount: threats.length,
      threats: threats.map((threat) => ({
        type: threat.type,
        severity: threat.severity,
        description: threat.message,
      })),
    },
    context
  );
}

/**
 * Handle generation errors
 * @param {Error} error - Original generation error
 * @param {Object} context - Additional context
 * @returns {Object} Error response for generation failures
 */
export function handleGenerationError(error, context = {}) {
  const message = `CSS generation failed: ${error.message}`;

  return createErrorResponse(
    ERROR_CODES.GENERATION_FAILED,
    message,
    {
      originalError: error.message,
      phase: "css_generation",
    },
    context
  );
}

/**
 * Handle input validation errors
 * @param {string} reason - Reason for invalid input
 * @param {any} input - The invalid input
 * @param {Object} context - Additional context
 * @returns {Object} Error response for invalid input
 */
export function handleInputError(reason, input, context = {}) {
  return createErrorResponse(
    ERROR_CODES.INVALID_INPUT,
    `Invalid input: ${reason}`,
    {
      inputType: typeof input,
      inputLength: Array.isArray(input) ? input.length : undefined,
      reason,
    },
    context
  );
}

/**
 * Handle rate limiting errors
 * @param {Object} limits - Rate limit information
 * @param {Object} context - Additional context
 * @returns {Object} Error response for rate limiting
 */
export function handleRateLimitError(limits, context = {}) {
  const message = "Rate limit exceeded. Please slow down your requests.";

  return createErrorResponse(
    ERROR_CODES.RATE_LIMITED,
    message,
    {
      retryAfter: limits.retryAfter || 60,
      limit: limits.limit,
      remaining: limits.remaining || 0,
      resetTime: limits.resetTime,
    },
    context
  );
}

/**
 * Wrap function with error handling
 * @param {Function} fn - Function to wrap
 * @param {Object} defaultContext - Default context for errors
 * @returns {Function} Wrapped function with error handling
 */
export function withErrorHandling(fn, defaultContext = {}) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      // Determine error type and handle appropriately
      if (error.code && Object.values(ERROR_CODES).includes(error.code)) {
        // Already a structured error
        return createErrorResponse(
          error.code,
          error.message,
          error.details || {},
          {
            ...defaultContext,
            ...error.context,
          }
        );
      }

      // Generic error handling
      logger.error("Unhandled error in API:", error);

      return createErrorResponse(
        ERROR_CODES.GENERATION_FAILED,
        "An unexpected error occurred",
        {
          originalError: error.message,
          stack:
            process.env.NODE_ENV === "development" ? error.stack : undefined,
        },
        defaultContext
      );
    }
  };
}

/**
 * Validate and normalize error response
 * @param {Object} response - Response object to validate
 * @returns {Object} Normalized response
 */
export function normalizeResponse(response) {
  // Ensure required fields exist
  const normalized = {
    success: response.success || false,
    css: response.css || "",
    invalid: Array.isArray(response.invalid) ? response.invalid : [],
    stats: response.stats || {
      totalInput: 0,
      validClasses: 0,
      invalidClasses: 0,
      generatedRules: 0,
      processingTime: 0,
    },
  };

  // Add error information if present
  if (response.error) {
    normalized.error = response.error;
  }

  // Ensure stats are numbers
  Object.keys(normalized.stats).forEach((key) => {
    if (typeof normalized.stats[key] === "string") {
      const num = parseFloat(normalized.stats[key]);
      if (!isNaN(num)) {
        normalized.stats[key] = num;
      }
    }
  });

  return normalized;
}

/**
 * Check if response indicates success
 * @param {Object} response - Response to check
 * @returns {boolean} True if response indicates success
 */
export function isSuccessResponse(response) {
  return (
    response &&
    response.success === true &&
    !response.error &&
    typeof response.css === "string"
  );
}

/**
 * Extract error information from response
 * @param {Object} response - Response to extract error from
 * @returns {Object|null} Error information or null if no error
 */
export function extractError(response) {
  if (!response || response.success) {
    return null;
  }

  return {
    code: response.error?.code || ERROR_CODES.GENERATION_FAILED,
    message: response.error?.message || "Unknown error occurred",
    details: response.error?.details || {},
    context: response.error?.context || {},
  };
}
