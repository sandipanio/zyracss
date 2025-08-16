/**
 * CSS value parsing logic for complex values and functions
 * Handles comma-separated values, CSS functions, and shorthand syntax
 */

import { detectDangerousPatterns } from "../security/index.js";

/**
 * Enhanced CSS syntax parser that handles complex values and functions
 * @param {string} cssValue - Raw CSS value to parse
 * @returns {Object|null} Parsed value object or null if invalid
 */
export function parseCSSSyntax(cssValue) {
  if (!cssValue || typeof cssValue !== "string") {
    return null;
  }

  // Security validation - check for dangerous patterns in CSS values
  const securityCheck = detectDangerousPatterns(cssValue);
  if (securityCheck.isDangerous) {
    // Log the security issue and reject the value
    console.warn(`Dangerous CSS value detected: ${cssValue}`, {
      patterns: securityCheck.matchedPatterns.map((p) => p.name),
      riskLevel: securityCheck.riskLevel,
    });
    return null;
  }

  // Validate that multiple values only use commas as separators
  if (!isValidMultiValueSyntax(cssValue)) {
    return null;
  }

  // Check if this is a SINGLE CSS function (like linear-gradient, rgba, etc.)
  // Only treat as function if the entire value is a single function call
  if (isSingleCSSFunction(cssValue)) {
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
 * Check if CSS value is a SINGLE CSS function (not part of multiple values)
 * @param {string} value - CSS value to check
 * @returns {boolean} True if the entire value is a single CSS function
 */
function isSingleCSSFunction(value) {
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

  // Check if the value starts with a function and is properly closed
  for (const func of cssFunctions) {
    if (value.startsWith(`${func}(`)) {
      // Find the matching closing parenthesis
      let parenCount = 0;
      let startPos = value.indexOf("(");

      for (let i = startPos; i < value.length; i++) {
        if (value[i] === "(") parenCount++;
        if (value[i] === ")") parenCount--;

        if (parenCount === 0) {
          // Check if there's anything significant after the closing paren
          const remainder = value.slice(i + 1).trim();
          return remainder === ""; // True only if nothing follows
        }
      }
    }
  }

  return false;
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

/**
 * Validate that multiple values only use commas as separators
 * Rejects values with underscores, spaces, or other invalid separators
 * @param {string} value - Value to validate
 * @returns {boolean} True if valid syntax
 */
function isValidMultiValueSyntax(value) {
  // If it's a CSS function, allow anything inside parentheses
  if (containsCSSFunction(value)) {
    return true;
  }

  // Check for invalid separators outside of parentheses
  let parenDepth = 0;
  let hasCommas = false;

  for (let i = 0; i < value.length; i++) {
    const char = value[i];

    if (char === "(") {
      parenDepth++;
    } else if (char === ")") {
      parenDepth--;
    } else if (parenDepth === 0) {
      // Outside parentheses - check for invalid separators
      if (char === ",") {
        hasCommas = true;
      } else if (char === "_" || char === "|" || char === ";") {
        // Reject underscore, pipe, semicolon as separators
        return false;
      }
    }
  }

  // If the value contains commas, validate that spaces aren't used as separators
  if (hasCommas) {
    // Split by commas and check each part
    const commaParts = smartCommaSplit(value);
    if (commaParts.length > 1) {
      // Check if any comma-separated part contains multiple space-separated values
      for (const part of commaParts) {
        const trimmedPart = part.trim();
        // If a part contains multiple space-separated values, it's invalid
        const spaceParts = trimmedPart.split(/\s+/).filter((p) => p.length > 0);
        if (spaceParts.length > 1) {
          // Only allow spaces in CSS functions like rgba(0, 0, 0, 0.1)
          if (!containsCSSFunction(trimmedPart)) {
            return false;
          }
        }
      }
    }
  } else {
    // No commas - check if there are multiple space-separated values
    const spaceParts = value.split(/\s+/).filter((part) => part.length > 0);
    if (spaceParts.length > 1) {
      // Multiple space-separated values without commas is invalid
      return false;
    }
  }

  return true;
}
