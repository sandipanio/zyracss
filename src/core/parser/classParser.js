/**
 * Individual utility class parsing logic
 * Handles the core logic of breaking down a single utility class
 */

import { PROPERTY_MAP } from "../maps/index.js";
import { validateClassSyntax, validateValue } from "../validators/index.js";
import { sanitizeInput } from "../security/index.js";
import { parseCSSSyntax } from "./valueParser.js";
import { generateSelector } from "./syntaxValidator.js";

/**
 * Parse a single utility class into its components
 * @param {string} className - The utility class to parse (e.g., "p-[24px]", "bg-[#111]")
 * @returns {Object|null} Parsed class object or null if invalid
 */
export function parseClass(className) {
  // Security: Sanitize and validate input
  const sanitized = sanitizeInput(className);
  if (!sanitized || !validateClassSyntax(sanitized)) {
    return null;
  }

  // Match bracket syntax: prefix-[value]
  const bracketMatch = sanitized.match(/^([a-zA-Z-]+)-\[([^\]]+)\]$/);
  if (bracketMatch) {
    const [, prefix, value] = bracketMatch;
    return parseBracketSyntax(prefix, value);
  }

  // Match shorthand syntax: prefix-value (no special chars)
  const shorthandMatch = sanitized.match(/^([a-zA-Z-]+)-([a-zA-Z0-9#.-]+)$/);
  if (shorthandMatch) {
    const [, prefix, value] = shorthandMatch;
    return parseShorthandSyntax(prefix, value);
  }

  return null;
}

/**
 * Parse bracket syntax utility class with enhanced CSS value parsing
 * @param {string} prefix - The property prefix (e.g., "p", "bg", "text")
 * @param {string} value - The CSS value inside brackets
 * @returns {Object|null} Parsed class object
 */
function parseBracketSyntax(prefix, value) {
  // Look up CSS property from prefix
  const property = PROPERTY_MAP.get(prefix);
  if (!property) {
    return null;
  }

  // Parse CSS values intelligently
  const parsedValues = parseCSSSyntax(value);
  if (!parsedValues) {
    return null;
  }

  // Validate the CSS value
  if (!validateValue(parsedValues.cssValue, property)) {
    return null;
  }

  return {
    className: `${prefix}-[${value}]`,
    prefix,
    property,
    value: parsedValues.cssValue,
    rawValue: value,
    values: parsedValues.values,
    syntax: "bracket",
    selector: generateSelector(`${prefix}-[${value}]`),
  };
}

/**
 * Parse shorthand syntax utility class
 * @param {string} prefix - The property prefix
 * @param {string} value - The CSS value
 * @returns {Object|null} Parsed class object
 */
function parseShorthandSyntax(prefix, value) {
  const property = PROPERTY_MAP.get(prefix);
  if (!property) {
    return null;
  }

  // Simple validation for shorthand values
  if (!validateValue(value, property)) {
    return null;
  }

  return {
    className: `${prefix}-${value}`,
    prefix,
    property,
    value,
    rawValue: value,
    values: [value],
    syntax: "shorthand",
    selector: generateSelector(`${prefix}-${value}`),
  };
}
