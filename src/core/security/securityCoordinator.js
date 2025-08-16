/**
 * Security coordinator - Complex security functions
 * Coordinates multiple security checks and validations
 */

import { detectDangerousPatterns } from "./patternDetector.js";
import { sanitizeInput } from "./inputSanitizer.js";
import { validateLength } from "./lengthValidator.js";

/**
 * Perform comprehensive security check on input
 * @param {string} input - Input to check
 * @returns {Object} Security check result
 */
export function performSecurityCheck(input) {
  // Input validation
  if (typeof input !== "string") {
    return {
      isValid: false,
      issues: ["Input must be a string"],
      sanitized: null,
    };
  }

  // Length validation
  const lengthCheck = validateLength(input, "class");
  if (!lengthCheck.isValid) {
    return {
      isValid: false,
      issues: [lengthCheck.reason],
      sanitized: null,
    };
  }

  // Pattern detection
  const patternCheck = detectDangerousPatterns(input);
  if (patternCheck.isDangerous) {
    return {
      isValid: false,
      issues: patternCheck.matchedPatterns.map((p) => p.description),
      sanitized: null,
    };
  }

  // Sanitization
  const sanitized = sanitizeInput(input);

  return {
    isValid: true,
    issues: [],
    sanitized,
  };
}

/**
 * Perform batch security check on multiple inputs
 * @param {string[]} inputs - Array of inputs to check
 * @returns {Object} Batch security check result
 */
export function performBatchSecurityCheck(inputs) {
  if (!Array.isArray(inputs)) {
    return {
      isValid: false,
      issues: ["Inputs must be an array"],
      results: [],
    };
  }

  const results = inputs.map((input) => performSecurityCheck(input));
  const allValid = results.every((result) => result.isValid);
  const allIssues = results.flatMap((result) => result.issues);

  return {
    isValid: allValid,
    issues: allIssues,
    results,
  };
}
