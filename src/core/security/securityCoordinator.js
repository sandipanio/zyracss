/**
 * Security coordination functions
 * Complex security orchestration logic separated from the main index
 */

import { validateLength, validateArrayLength } from "./lengthValidator.js";
import { detectDangerousPatterns } from "./patternDetector.js";
import { sanitizeInput } from "./inputSanitizer.js";

/**
 * Comprehensive security check for input
 * @param {string} input - Input to validate
 * @param {Object} options - Security options
 * @returns {Object} Complete security assessment
 */
export function performSecurityCheck(input, options = {}) {
  const { type = "class", level = "normal", includeDetails = false } = options;

  const results = {
    isSecure: true,
    threats: [],
    warnings: [],
    sanitized: null,
  };

  // 1. Length validation
  const lengthCheck = validateLength(input, type);
  if (!lengthCheck.isValid) {
    results.isSecure = false;
    results.threats.push({
      type: "length",
      severity: "medium",
      message: lengthCheck.reason,
      details: includeDetails ? lengthCheck : undefined,
    });
    return results;
  }

  // 2. Pattern detection
  const patternCheck = detectDangerousPatterns(input);
  if (patternCheck.isDangerous) {
    results.isSecure = false;

    patternCheck.matchedPatterns.forEach((pattern) => {
      results.threats.push({
        type: "dangerous_pattern",
        severity: pattern.riskLevel,
        message: `Dangerous pattern detected: ${pattern.description}`,
        pattern: pattern.name,
        details: includeDetails ? pattern : undefined,
      });
    });

    return results;
  }

  // 3. Input sanitization
  const sanitized = sanitizeInput(input);
  if (!sanitized) {
    results.isSecure = false;
    results.threats.push({
      type: "sanitization_failed",
      severity: "high",
      message: "Input could not be safely sanitized",
    });
    return results;
  }

  // 4. Check if sanitization changed the input
  if (sanitized !== input) {
    results.warnings.push({
      type: "input_modified",
      severity: "low",
      message: "Input was modified during sanitization",
      original: includeDetails ? input : undefined,
      sanitized: includeDetails ? sanitized : undefined,
    });
  }

  results.sanitized = sanitized;
  return results;
}

/**
 * Batch security check for multiple inputs
 * @param {Array} inputs - Array of inputs to check
 * @param {Object} options - Security options
 * @returns {Object} Batch security results
 */
export function performBatchSecurityCheck(inputs, options = {}) {
  if (!Array.isArray(inputs)) {
    return {
      isSecure: false,
      results: [],
      summary: {
        total: 0,
        secure: 0,
        threats: 1,
        warnings: 0,
      },
      error: "Input must be an array",
    };
  }

  const results = [];
  let secure = 0;
  let threats = 0;
  let warnings = 0;

  // First check array size
  const arrayCheck = validateArrayLength(inputs);
  if (!arrayCheck.isValid) {
    return {
      isSecure: false,
      results: [],
      summary: {
        total: inputs.length,
        secure: 0,
        threats: 1,
        warnings: 0,
      },
      error: arrayCheck.reason,
    };
  }

  // Check each input
  for (const input of inputs) {
    const result = performSecurityCheck(input, options);
    results.push({
      input,
      ...result,
    });

    if (result.isSecure) {
      secure++;
    } else {
      threats++;
    }

    warnings += result.warnings.length;
  }

  return {
    isSecure: threats === 0,
    results,
    summary: {
      total: inputs.length,
      secure,
      threats,
      warnings,
      securePercentage:
        inputs.length > 0 ? ((secure / inputs.length) * 100).toFixed(2) : 0,
    },
  };
}
