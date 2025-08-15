/**
 * CSS value validation logic
 * Validates CSS values against property types and patterns
 */

import { getExpectedValueType } from "./propertyValidator.js";
import { getValidationPatterns } from "./patternValidator.js";
import { isSafeValue } from "../security/index.js";

/**
 * Validate CSS value for a given property
 * @param {string} value - CSS value to validate
 * @param {string} property - CSS property name
 * @returns {boolean} True if valid
 */
export function validateValue(value, property) {
  if (!value || typeof value !== "string") {
    return false;
  }

  // Security check first
  if (!isSafeValue(value)) {
    return false;
  }

  // Get expected value type for this property
  const expectedType = getExpectedValueType(property);

  // Validate based on property type
  return validateValueForType(value, expectedType);
}

/**
 * Validate value against a specific type
 * @param {string} value - CSS value to validate
 * @param {string} type - Expected value type
 * @returns {boolean} True if valid
 */
export function validateValueForType(value, type) {
  const patterns = getValidationPatterns();

  switch (type) {
    case "length":
      return (
        patterns.length.test(value) ||
        patterns.number.test(value) ||
        value.includes(" ")
      ); // Multiple values

    case "color":
      return patterns.color.test(value);

    case "keyword":
      return patterns.keyword.test(value);

    case "number":
      return patterns.number.test(value);

    case "function":
      return patterns.cssFunction.test(value) || patterns.keyword.test(value);

    case "complex":
      return patterns.complex.test(value);

    case "mixed":
    default:
      // For unknown properties, use basic safety checks
      return patterns.safe.test(value);
  }
}

/**
 * Validate multiple values (comma or space separated)
 * @param {string} values - Space or comma separated values
 * @param {string} property - CSS property name
 * @returns {boolean} True if all values are valid
 */
export function validateMultipleValues(values, property) {
  if (!values || typeof values !== "string") {
    return false;
  }

  // Split by spaces (CSS shorthand) or keep as single value
  const valueArray = values.trim().split(/\s+/);

  // Validate each value
  return valueArray.every((value) => validateValue(value.trim(), property));
}

/**
 * Check if value is a valid CSS function
 * @param {string} value - Value to check
 * @returns {boolean} True if valid CSS function
 */
export function isValidCSSFunction(value) {
  const patterns = getValidationPatterns();
  return patterns.cssFunction.test(value);
}
