/**
 * CSS value parsing logic for complex values and functions
 * Handles comma-separated values, CSS functions, and shorthand syntax
 */

/**
 * Enhanced CSS syntax parser that handles complex values and functions
 * @param {string} cssValue - Raw CSS value to parse
 * @returns {Object|null} Parsed value object or null if invalid
 */
export function parseCSSSyntax(cssValue) {
  if (!cssValue || typeof cssValue !== "string") {
    return null;
  }

  // Check if this is a CSS function (like linear-gradient, rgba, etc.)
  if (containsCSSFunction(cssValue)) {
    // For CSS functions, don't split on commas inside functions
    return {
      cssValue: cssValue.trim(),
      values: [cssValue.trim()],
      isFunction: true,
    };
  }

  // Split on commas for shorthand values (like padding: 1rem 2rem)
  // Only split if not inside parentheses
  const values = smartCommaSplit(cssValue);

  if (values.length === 1) {
    return {
      cssValue: values[0].trim(),
      values: values,
      isFunction: false,
    };
  }

  // Multiple values - join with spaces for CSS shorthand
  const trimmedValues = values.map((v) => v.trim());
  return {
    cssValue: trimmedValues.join(" "),
    values: trimmedValues,
    isFunction: false,
  };
}

/**
 * Check if CSS value contains functions (like linear-gradient, rgba, etc.)
 * @param {string} value - CSS value to check
 * @returns {boolean} True if contains CSS functions
 */
function containsCSSFunction(value) {
  // Common CSS functions that contain commas
  const cssFunctions = [
    "linear-gradient",
    "radial-gradient",
    "conic-gradient",
    "rgb",
    "rgba",
    "hsl",
    "hsla",
    "calc",
    "min",
    "max",
    "clamp",
    "var",
    "env",
    "url",
    "image",
    "transform",
    "rotate",
    "scale",
    "translate",
    "cubic-bezier",
    "steps",
  ];

  return cssFunctions.some((func) => value.includes(`${func}(`));
}

/**
 * Smart comma splitting that respects parentheses
 * @param {string} value - Value to split
 * @returns {Array} Array of split values
 */
function smartCommaSplit(value) {
  const result = [];
  let current = "";
  let parenDepth = 0;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === "(") {
      parenDepth++;
    } else if (char === ")") {
      parenDepth--;
    } else if (char === "," && parenDepth === 0) {
      // Only split on comma if we're not inside parentheses
      result.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  if (current) {
    result.push(current);
  }

  return result.length > 0 ? result : [value];
}
