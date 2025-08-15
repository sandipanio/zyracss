/**
 * CSS-related utility functions
 * Helper functions for CSS processing and manipulation
 */

/**
 * Escape CSS class name for use in selectors
 * @param {string} className - Class name to escape
 * @returns {string} Escaped class name
 */
export function escapeCSSSelector(className) {
  if (typeof className !== "string") {
    return "";
  }

  // Escape special CSS characters
  return className.replace(/[\[\]:,()]/g, "\\$&");
}

/**
 * Normalize CSS property name
 * @param {string} property - CSS property name
 * @returns {string} Normalized property name
 */
export function normalizePropertyName(property) {
  if (typeof property !== "string") {
    return "";
  }

  return property.toLowerCase().trim();
}

/**
 * Check if a string is a valid CSS identifier
 * @param {string} identifier - String to check
 * @returns {boolean} True if valid CSS identifier
 */
export function isValidCSSIdentifier(identifier) {
  if (typeof identifier !== "string" || identifier.length === 0) {
    return false;
  }

  // CSS identifier pattern: starts with letter, underscore, or hyphen
  // followed by letters, numbers, hyphens, or underscores
  return /^[a-zA-Z_-][a-zA-Z0-9_-]*$/.test(identifier);
}

/**
 * Parse CSS shorthand value into individual components
 * @param {string} value - CSS shorthand value
 * @param {number} expectedParts - Expected number of parts (1-4)
 * @returns {Array<string>} Array of individual values
 */
export function parseShorthandValue(value, expectedParts = 4) {
  if (typeof value !== "string") {
    return [];
  }

  const parts = value.trim().split(/\s+/);

  // CSS shorthand expansion rules
  switch (parts.length) {
    case 1:
      // Single value applies to all sides
      return new Array(expectedParts).fill(parts[0]);

    case 2:
      // Two values: first=top/bottom, second=left/right
      return expectedParts === 4
        ? [parts[0], parts[1], parts[0], parts[1]]
        : parts.slice(0, expectedParts);

    case 3:
      // Three values: top, left/right, bottom
      return expectedParts === 4
        ? [parts[0], parts[1], parts[2], parts[1]]
        : parts.slice(0, expectedParts);

    case 4:
    default:
      // Four or more values: use first expectedParts
      return parts.slice(0, expectedParts);
  }
}

/**
 * Convert CSS value to consistent format
 * @param {string} value - CSS value to normalize
 * @returns {string} Normalized CSS value
 */
export function normalizeCSSValue(value) {
  if (typeof value !== "string") {
    return "";
  }

  let normalized = value.trim();

  // Normalize color values
  if (normalized.startsWith("#")) {
    // Ensure hex colors are lowercase
    normalized = normalized.toLowerCase();

    // Expand 3-digit hex to 6-digit
    if (normalized.length === 4) {
      normalized =
        "#" +
        normalized[1].repeat(2) +
        normalized[2].repeat(2) +
        normalized[3].repeat(2);
    }
  }

  // Normalize zero values
  if (/^0+(?:px|em|rem|%|vh|vw|in|cm|mm|pt|pc)$/.test(normalized)) {
    normalized = "0";
  }

  // Remove unnecessary decimal zeros
  normalized = normalized.replace(/\.0+(?=\D|$)/g, "");

  return normalized;
}

/**
 * Check if CSS value is a length unit
 * @param {string} value - Value to check
 * @returns {boolean} True if value is a length
 */
export function isCSSLength(value) {
  if (typeof value !== "string") {
    return false;
  }

  const lengthPattern =
    /^-?[\d.]+(?:px|em|rem|vh|vw|%|in|cm|mm|pt|pc|ex|ch|vmin|vmax|fr)$/;
  return lengthPattern.test(value.trim()) || value.trim() === "0";
}

/**
 * Check if CSS value is a color
 * @param {string} value - Value to check
 * @returns {boolean} True if value is a color
 */
export function isCSSColor(value) {
  if (typeof value !== "string") {
    return false;
  }

  const trimmed = value.trim();

  // Hex colors
  if (/^#[\da-f]{3,8}$/i.test(trimmed)) {
    return true;
  }

  // RGB/RGBA functions
  if (/^rgba?\([^)]+\)$/i.test(trimmed)) {
    return true;
  }

  // HSL/HSLA functions
  if (/^hsla?\([^)]+\)$/i.test(trimmed)) {
    return true;
  }

  // Named colors (basic check)
  const namedColors = [
    "transparent",
    "currentcolor",
    "inherit",
    "initial",
    "unset",
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "gray",
    "grey",
  ];

  return namedColors.includes(trimmed.toLowerCase());
}

/**
 * Generate CSS rule string
 * @param {string} selector - CSS selector
 * @param {Object} declarations - CSS declarations object
 * @param {Object} options - Formatting options
 * @returns {string} CSS rule string
 */
export function generateCSSRule(selector, declarations, options = {}) {
  const { minify = false, indent = "  " } = options;

  if (!selector || !declarations || typeof declarations !== "object") {
    return "";
  }

  const props = Object.entries(declarations)
    .filter(([, value]) => value !== null && value !== undefined)
    .map(([prop, value]) => `${minify ? "" : indent}${prop}: ${value};`)
    .join(minify ? "" : "\n");

  if (!props) {
    return "";
  }

  if (minify) {
    return `${selector}{${props}}`;
  } else {
    return `${selector} {\n${props}\n}`;
  }
}
