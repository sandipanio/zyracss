/**
 * Response Builder Utility
 */

/**
 * Standardized API response builder
 * Creates consistent response format across all API endpoints
 */
export class ResponseBuilder {
  /**
   * Create successful CSS generation response
   * @param {string} css - Generated CSS
   * @param {Array} rules - Generated CSS rules
   * @param {Object} stats - Processing statistics
   * @param {Array} invalid - Invalid classes (optional)
   * @returns {Object} Standardized success response
   */
  static createCSSResponse(css, rules = [], stats = {}, invalid = []) {
    return {
      success: true,
      css,
      rules,
      invalid,
      stats: {
        totalInput: 0,
        validClasses: 0,
        invalidClasses: invalid.length,
        generatedRules: rules.length,
        processingTime: 0,
        ...stats,
      },
    };
  }

  /**
   * Create error response with consistent format
   * @param {string} code - Error code
   * @param {string} message - Error message
   * @param {Object} context - Additional error context
   * @param {Array} invalid - Invalid items
   * @returns {Object} Standardized error response
   */
  static createErrorResponse(code, message, context = {}, invalid = []) {
    return {
      success: false,
      css: "",
      rules: [],
      invalid: Array.isArray(invalid) ? invalid : [invalid],
      error: {
        code,
        message,
        timestamp: new Date().toISOString(),
        ...context,
      },
      stats: {
        totalInput: 0,
        validClasses: 0,
        invalidClasses: Array.isArray(invalid) ? invalid.length : 1,
        generatedRules: 0,
        processingTime: 0,
        error: message,
      },
    };
  }

  /**
   * Create validation-only response
   * @param {Array} valid - Valid items
   * @param {Array} invalid - Invalid items with reasons
   * @param {Object} stats - Validation statistics
   * @returns {Object} Validation response
   */
  static createValidationResponse(valid, invalid = [], stats = {}) {
    return {
      success: true,
      valid,
      invalid,
      stats: {
        total: valid.length + invalid.length,
        validCount: valid.length,
        invalidCount: invalid.length,
        validPercentage:
          valid.length + invalid.length > 0
            ? ((valid.length / (valid.length + invalid.length)) * 100).toFixed(
                2
              )
            : 100,
        ...stats,
      },
    };
  }

  /**
   * Create input validation error response
   * @param {string} reason - Validation failure reason
   * @param {any} input - The invalid input
   * @param {Array} suggestions - Helpful suggestions
   * @returns {Object} Input validation error response
   */
  static createInputError(reason, input, suggestions = []) {
    return ResponseBuilder.createErrorResponse(
      "INVALID_INPUT",
      `Invalid input: ${reason}`,
      {
        inputType: typeof input,
        inputLength: Array.isArray(input) ? input.length : undefined,
        suggestions,
      },
      [reason]
    );
  }

  /**
   * Create security validation error response
   * @param {Array} threats - Detected security threats
   * @param {Object} context - Security context
   * @returns {Object} Security error response
   */
  static createSecurityError(threats, context = {}) {
    const threatList = Array.isArray(threats) ? threats : [threats];

    return ResponseBuilder.createErrorResponse(
      "SECURITY_VIOLATION",
      `Security violation: ${threatList.length} threat(s) detected`,
      {
        threatCount: threatList.length,
        threats: threatList.map((threat) => ({
          type: threat.type || "unknown",
          severity: threat.severity || "medium",
          description: threat.message || threat,
        })),
        ...context,
      },
      threatList.map((threat) => `Security threat: ${threat.message || threat}`)
    );
  }

  /**
   * Create parsing failure response
   * @param {string} input - Input that failed to parse
   * @param {string} reason - Parse failure reason
   * @param {Array} suggestions - Helpful suggestions
   * @returns {Object} Parse error response
   */
  static createParseError(input, reason, suggestions = []) {
    return ResponseBuilder.createErrorResponse(
      "PARSING_FAILED",
      `Failed to parse input: ${reason}`,
      {
        input: input.substring(0, 100), // Limit input size in error
        parseFailureReason: reason,
        suggestions,
      },
      [`Parse error: ${reason}`]
    );
  }

  /**
   * Create generation failure response
   * @param {string} className - Class that failed generation
   * @param {string} reason - Generation failure reason
   * @returns {Object} Generation error response
   */
  static createGenerationError(className, reason) {
    return ResponseBuilder.createErrorResponse(
      "GENERATION_FAILED",
      `CSS generation failed for "${className}": ${reason}`,
      {
        className,
        generationFailureReason: reason,
      },
      [`Generation failed: ${className}`]
    );
  }

  /**
   * Enhance existing response with additional data
   * @param {Object} baseResponse - Existing response object
   * @param {Object} enhancements - Additional data to merge
   * @returns {Object} Enhanced response
   */
  static enhanceResponse(baseResponse, enhancements = {}) {
    return {
      ...baseResponse,
      ...enhancements,
      stats: {
        ...baseResponse.stats,
        ...enhancements.stats,
      },
    };
  }

  /**
   * Check if response represents success
   * @param {Object} response - Response to check
   * @returns {boolean} True if successful response
   */
  static isSuccess(response) {
    return response && response.success === true;
  }

  /**
   * Check if response represents an error
   * @param {Object} response - Response to check
   * @returns {boolean} True if error response
   */
  static isError(response) {
    return response && response.success === false;
  }

  /**
   * Extract error message from response
   * @param {Object} response - Response to extract from
   * @returns {string|null} Error message or null
   */
  static getErrorMessage(response) {
    if (!ResponseBuilder.isError(response)) {
      return null;
    }

    return response.error?.message || "Unknown error occurred";
  }

  /**
   * Extract CSS from response safely
   * @param {Object} response - Response to extract from
   * @returns {string} CSS string (empty if error)
   */
  static getCSS(response) {
    return ResponseBuilder.isSuccess(response) ? response.css || "" : "";
  }

  /**
   * Extract invalid items from response
   * @param {Object} response - Response to extract from
   * @returns {Array} Array of invalid items
   */
  static getInvalidItems(response) {
    return Array.isArray(response.invalid) ? response.invalid : [];
  }

  /**
   * Create progress response for long-running operations
   * @param {number} progress - Progress percentage (0-100)
   * @param {string} status - Current status message
   * @param {Object} data - Partial data
   * @returns {Object} Progress response
   */
  static createProgressResponse(progress, status, data = {}) {
    return {
      success: true,
      progress: Math.min(100, Math.max(0, progress)),
      status,
      complete: progress >= 100,
      timestamp: new Date().toISOString(),
      ...data,
    };
  }

  /**
   * Merge multiple responses into one
   * @param {Array} responses - Array of responses to merge
   * @returns {Object} Merged response
   */
  static mergeResponses(responses) {
    if (!Array.isArray(responses) || responses.length === 0) {
      return ResponseBuilder.createErrorResponse(
        "INVALID_INPUT",
        "No responses to merge"
      );
    }

    if (responses.length === 1) {
      return responses[0];
    }

    const hasError = responses.some((r) => ResponseBuilder.isError(r));

    if (hasError) {
      // If any response has errors, collect all errors
      const allErrors = responses
        .filter((r) => ResponseBuilder.isError(r))
        .map((r) => ResponseBuilder.getErrorMessage(r));

      return ResponseBuilder.createErrorResponse(
        "MULTIPLE_ERRORS",
        `Multiple errors occurred: ${allErrors.join("; ")}`,
        { errorCount: allErrors.length },
        allErrors
      );
    }

    // All responses are successful, merge them
    const mergedCSS = responses
      .map((r) => ResponseBuilder.getCSS(r))
      .filter(Boolean)
      .join("\n");

    const mergedInvalid = responses.flatMap((r) =>
      ResponseBuilder.getInvalidItems(r)
    );

    const mergedStats = responses.reduce((acc, response) => {
      const stats = response.stats || {};
      return {
        totalInput: (acc.totalInput || 0) + (stats.totalInput || 0),
        validClasses: (acc.validClasses || 0) + (stats.validClasses || 0),
        invalidClasses: (acc.invalidClasses || 0) + (stats.invalidClasses || 0),
        generatedRules: (acc.generatedRules || 0) + (stats.generatedRules || 0),
        processingTime: Math.max(
          acc.processingTime || 0,
          stats.processingTime || 0
        ),
      };
    }, {});

    return ResponseBuilder.createCSSResponse(
      mergedCSS,
      [], // Rules would need special merging logic
      mergedStats,
      mergedInvalid
    );
  }
}
