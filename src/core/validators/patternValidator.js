/**
 * Validation patterns and rules for CSS values
 * Centralized regex patterns for consistent validation
 */

/**
 * Get all validation patterns used across the system
 * @returns {Object} Object containing all validation regex patterns
 */
export function getValidationPatterns() {
  return {
    // CSS Length units
    length: /^-?[\d.]+(?:px|em|rem|vh|vw|%|in|cm|mm|pt|pc|ex|ch|vmin|vmax|fr)$/,

    // Pure numbers (including decimals and negatives)
    number: /^-?[\d.]+$/,

    // CSS Colors (hex, rgb, rgba, hsl, hsla, named colors)
    color: /^(?:#[\da-f]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)|[a-z]+)$/i,

    // CSS Keywords (property values like 'block', 'center', etc.)
    keyword: /^[a-z-]+$/i,

    // CSS Functions
    cssFunction: /^[a-z-]+\([^)]*\)$/i,

    // Complex values (multiple functions, gradients, etc.)
    complex: /^[a-zA-Z0-9#.,()%-\s]+$/,

    // Safe general pattern for unknown properties
    safe: /^[a-zA-Z0-9#.,()%-\s]+$/,

    // Dangerous patterns that should be blocked
    dangerous:
      /(?:javascript:|data:|expression\s*\(|behavior\s*:|binding\s*:|@import|<script|<iframe|on\w+\s*=)/i,
  };
}

/**
 * Get patterns for specific CSS property categories
 * @param {string} category - Property category
 * @returns {RegExp|null} Regex pattern for the category
 */
export function getPatternForCategory(category) {
  const patterns = getValidationPatterns();

  const categoryMap = {
    spacing: patterns.length,
    sizing: patterns.length,
    colors: patterns.color,
    typography: patterns.keyword,
    layout: patterns.keyword,
    effects: patterns.complex,
  };

  return categoryMap[category] || null;
}

/**
 * Validate value against multiple patterns
 * @param {string} value - Value to validate
 * @param {Array<string>} patternNames - Array of pattern names to test
 * @returns {boolean} True if value matches any pattern
 */
export function validateAgainstPatterns(value, patternNames) {
  if (!value || !Array.isArray(patternNames)) {
    return false;
  }

  const patterns = getValidationPatterns();

  return patternNames.some((patternName) => {
    const pattern = patterns[patternName];
    return pattern && pattern.test(value);
  });
}

/**
 * Get detailed validation info for a value
 * @param {string} value - Value to analyze
 * @returns {Object} Detailed validation information
 */
export function getValidationInfo(value) {
  if (!value || typeof value !== "string") {
    return {
      isValid: false,
      matchedPatterns: [],
      suggestedType: null,
      hasDangerousContent: false,
    };
  }

  const patterns = getValidationPatterns();
  const matchedPatterns = [];

  // Test against all patterns
  Object.entries(patterns).forEach(([name, pattern]) => {
    if (name !== "dangerous" && pattern.test(value)) {
      matchedPatterns.push(name);
    }
  });

  // Check for dangerous content
  const hasDangerousContent = patterns.dangerous.test(value);

  // Suggest the most specific type
  const suggestedType = getSuggestedType(matchedPatterns);

  return {
    isValid: matchedPatterns.length > 0 && !hasDangerousContent,
    matchedPatterns,
    suggestedType,
    hasDangerousContent,
  };
}

/**
 * Suggest the most appropriate type based on matched patterns
 * @param {Array<string>} matchedPatterns - Array of matched pattern names
 * @returns {string|null} Suggested type
 */
function getSuggestedType(matchedPatterns) {
  // Priority order: more specific patterns first
  const typePriority = [
    "color",
    "length",
    "number",
    "cssFunction",
    "keyword",
    "complex",
    "safe",
  ];

  for (const type of typePriority) {
    if (matchedPatterns.includes(type)) {
      return type;
    }
  }

  return null;
}

/**
 * Validate CSS shorthand values (space-separated)
 * @param {string} value - Shorthand value to validate
 * @param {string} expectedPattern - Pattern name to validate against
 * @returns {boolean} True if all parts are valid
 */
export function validateShorthandValue(value, expectedPattern) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const patterns = getValidationPatterns();
  const pattern = patterns[expectedPattern];

  if (!pattern) {
    return false;
  }

  // Split by spaces and validate each part
  const parts = value.trim().split(/\s+/);
  return parts.every((part) => pattern.test(part.trim()));
}
