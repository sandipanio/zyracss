/**
 * Validators module - Main coordination for all validation logic
 * Provides unified interface for CSS property and value validation
 */

// Property validation
export {
  validatePrefix,
  getPropertyForPrefix,
  isSupportedProperty,
  getExpectedValueType,
} from "./propertyValidator.js";

// Value validation
export {
  validateValue,
  validateMultipleValues,
  isValidCSSFunction,
} from "./valueValidator.js";

// Class validation
export {
  validateClasses,
  validateSingleClass,
  validateClassesBatched,
  getValidationStats,
} from "./classValidator.js";

// Pattern validation
export {
  getValidationPatterns,
  getPatternForCategory,
  validateAgainstPatterns,
  getValidationInfo,
  validateShorthandValue,
} from "./patternValidator.js";

// Re-export syntax validation from parser
export { validateClassSyntax } from "../parser/syntaxValidator.js";

/**
 * Main validation function that orchestrates all validation types
 * @param {string} className - Class name to validate
 * @param {Object} options - Validation options
 * @returns {Object} Comprehensive validation result
 */
export async function validateUtilityClass(className, options = {}) {
  const { strict = false, includeDetails = false } = options;

  // Import here to avoid circular dependencies
  const { parseClass } = await import("../parser/classParser.js");

  try {
    // Parse the class to get components
    const parsed = parseClass(className);

    if (!parsed) {
      return {
        isValid: false,
        reason: "Failed to parse class name",
        details: includeDetails ? { className, parsed: null } : undefined,
      };
    }

    // Validate property
    const isValidProperty = isSupportedProperty(parsed.property);
    if (!isValidProperty && strict) {
      return {
        isValid: false,
        reason: `Unsupported CSS property: ${parsed.property}`,
        details: includeDetails
          ? { className, parsed, property: parsed.property }
          : undefined,
      };
    }

    // Validate value
    const isValidValue = validateValue(parsed.value, parsed.property);
    if (!isValidValue) {
      return {
        isValid: false,
        reason: `Invalid value for property ${parsed.property}: ${parsed.value}`,
        details: includeDetails
          ? { className, parsed, value: parsed.value }
          : undefined,
      };
    }

    return {
      isValid: true,
      reason: null,
      details: includeDetails
        ? {
            className,
            parsed,
            property: parsed.property,
            value: parsed.value,
          }
        : undefined,
    };
  } catch (error) {
    return {
      isValid: false,
      reason: `Validation error: ${error.message}`,
      details: includeDetails ? { className, error: error.message } : undefined,
    };
  }
}
