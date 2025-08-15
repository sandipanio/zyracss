/**
 * CSS property validation logic
 * Validates CSS property names and their expected value types
 */

import { PROPERTY_MAP } from "../maps/index.js";

/**
 * Validate if a prefix maps to a valid CSS property
 * @param {string} prefix - The utility prefix to validate
 * @returns {boolean} True if prefix is valid
 */
export function validatePrefix(prefix) {
  if (!prefix || typeof prefix !== "string") {
    return false;
  }

  return PROPERTY_MAP.has(prefix);
}

/**
 * Get the CSS property name for a given prefix
 * @param {string} prefix - The utility prefix
 * @returns {string|null} CSS property name or null if invalid
 */
export function getPropertyForPrefix(prefix) {
  return PROPERTY_MAP.get(prefix) || null;
}

/**
 * Validate if a CSS property is supported
 * @param {string} property - CSS property name to validate
 * @returns {boolean} True if property is supported
 */
export function isSupportedProperty(property) {
  if (!property || typeof property !== "string") {
    return false;
  }

  // Get all values from property map
  const supportedProperties = new Set(PROPERTY_MAP.values());
  return supportedProperties.has(property);
}

/**
 * Get the expected value type for a CSS property
 * @param {string} property - CSS property name
 * @returns {string} Expected value type
 */
export function getExpectedValueType(property) {
  const propertyTypes = {
    // Length properties
    padding: "length",
    "padding-top": "length",
    "padding-right": "length",
    "padding-bottom": "length",
    "padding-left": "length",
    "padding-block": "length",
    "padding-inline": "length",
    margin: "length",
    "margin-top": "length",
    "margin-right": "length",
    "margin-bottom": "length",
    "margin-left": "length",
    "margin-block": "length",
    "margin-inline": "length",
    width: "length",
    height: "length",
    "font-size": "length",
    "line-height": "length",

    // Color properties
    color: "color",
    "background-color": "color",
    "border-color": "color",
    "border-top-color": "color",
    "border-right-color": "color",
    "border-bottom-color": "color",
    "border-left-color": "color",

    // Keyword properties
    display: "keyword",
    position: "keyword",
    "text-align": "keyword",
    "font-weight": "keyword",
    "text-decoration": "keyword",
    "text-transform": "keyword",
    "font-style": "keyword",

    // Number properties
    opacity: "number",
    "z-index": "number",

    // Complex properties
    transform: "function",
    "box-shadow": "complex",
    "background-image": "complex",
  };

  return propertyTypes[property] || "mixed";
}
