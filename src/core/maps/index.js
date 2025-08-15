/**
 * Central property mapping system for ZyraCSS
 * Maps utility prefixes to CSS properties
 */

import { SPACING_MAP } from "./spacing.js";
import { TYPOGRAPHY_MAP } from "./typography.js";
import { COLOR_MAP } from "./color.js";
import { LAYOUT_MAP } from "./layout.js";
import { SIZING_MAP } from "./sizing.js";
import { BORDERS_MAP } from "./borders.js";
import { EFFECTS_MAP } from "./effects.js";

/**
 * Combined property map - O(1) lookups for performance
 * Each entry maps: prefix -> CSS property name
 */
export const PROPERTY_MAP = new Map([
  ...SPACING_MAP,
  ...TYPOGRAPHY_MAP,
  ...COLOR_MAP,
  ...LAYOUT_MAP,
  ...SIZING_MAP,
  ...BORDERS_MAP,
  ...EFFECTS_MAP,
]);

/**
 * Get CSS property for a given prefix
 * @param {string} prefix - The utility prefix (e.g., "p", "bg", "text")
 * @returns {string|null} CSS property name or null if not found
 */
export function getProperty(prefix) {
  return PROPERTY_MAP.get(prefix) || null;
}

/**
 * Check if a prefix is valid
 * @param {string} prefix - The prefix to check
 * @returns {boolean} True if prefix is valid
 */
export function isValidPrefix(prefix) {
  return PROPERTY_MAP.has(prefix);
}

/**
 * Get all available prefixes (for autocomplete/validation)
 * @returns {Array<string>} Array of all valid prefixes
 */
export function getAllPrefixes() {
  return Array.from(PROPERTY_MAP.keys());
}
