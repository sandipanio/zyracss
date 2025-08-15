/**
 * Input sanitization and cleaning logic
 * Handles safe cleaning of user input before processing
 */

import { MAX_CLASS_LENGTH, MAX_VALUE_LENGTH } from "./securityConstants.js";

/**
 * Sanitize and clean input string
 * @param {string} input - Input to sanitize
 * @returns {string|null} Sanitized input or null if invalid
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") {
    return null;
  }

  // Length validation
  if (input.length > MAX_CLASS_LENGTH) {
    return null;
  }

  // Remove dangerous characters and control characters
  const cleaned = cleanDangerousCharacters(input);

  if (!cleaned) {
    return null;
  }

  return cleaned.trim();
}

/**
 * Sanitize CSS value specifically
 * @param {string} value - CSS value to sanitize
 * @returns {string|null} Sanitized value or null if invalid
 */
export function sanitizeValue(value) {
  if (typeof value !== "string") {
    return null;
  }

  // Length validation for values
  if (value.length > MAX_VALUE_LENGTH) {
    return null;
  }

  // Remove dangerous characters
  const cleaned = cleanDangerousCharacters(value);

  if (!cleaned) {
    return null;
  }

  return cleaned.trim();
}

/**
 * Clean dangerous characters from input
 * @param {string} input - Input to clean
 * @returns {string|null} Cleaned input or null if too dangerous
 */
function cleanDangerousCharacters(input) {
  // Remove null bytes and control characters (except tab, newline, carriage return)
  let cleaned = input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, " ");

  // If the cleaning removed too much content, it might be suspicious
  if (cleaned.length < input.length * 0.5 && input.length > 10) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize array of inputs
 * @param {Array} inputs - Array of inputs to sanitize
 * @returns {Object} Object with sanitized and failed inputs
 */
export function sanitizeInputArray(inputs) {
  if (!Array.isArray(inputs)) {
    return {
      sanitized: [],
      failed: ["Input must be an array"],
    };
  }

  const sanitized = [];
  const failed = [];

  for (const input of inputs) {
    const cleaned = sanitizeInput(input);
    if (cleaned !== null) {
      sanitized.push(cleaned);
    } else {
      failed.push(input);
    }
  }

  return { sanitized, failed };
}

/**
 * Deep sanitize object properties (for complex inputs)
 * @param {Object} obj - Object to sanitize
 * @param {Array<string>} stringProps - Properties that should be sanitized as strings
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj, stringProps = []) {
  if (!obj || typeof obj !== "object") {
    return null;
  }

  const sanitized = { ...obj };

  for (const prop of stringProps) {
    if (sanitized[prop] && typeof sanitized[prop] === "string") {
      const cleaned = sanitizeInput(sanitized[prop]);
      if (cleaned === null) {
        // If sanitization fails, remove the property
        delete sanitized[prop];
      } else {
        sanitized[prop] = cleaned;
      }
    }
  }

  return sanitized;
}

/**
 * Check if input needs sanitization
 * @param {string} input - Input to check
 * @returns {boolean} True if input needs sanitization
 */
export function needsSanitization(input) {
  if (typeof input !== "string") {
    return true;
  }

  // Check for control characters
  if (/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(input)) {
    return true;
  }

  // Check for excessive whitespace
  if (/\s{2,}/.test(input)) {
    return true;
  }

  // Check length
  if (input.length > MAX_CLASS_LENGTH) {
    return true;
  }

  return false;
}
