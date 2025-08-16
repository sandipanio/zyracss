/**
 * String manipulation utility functions
 * General-purpose string processing helpers
 */

/**
 * Safely trim a string
 * @param {any} input - Input to trim
 * @returns {string} Trimmed string or empty string
 */
export function safeTrim(input) {
  return typeof input === "string" ? input.trim() : "";
}

/**
 * Split string by multiple delimiters
 * @param {string} str - String to split
 * @param {Array<string>} delimiters - Array of delimiter strings
 * @returns {Array<string>} Array of split parts
 */
export function splitByDelimiters(str, delimiters = [" ", "\t", "\n"]) {
  if (typeof str !== "string") {
    return [];
  }

  const pattern = new RegExp(
    `[${delimiters.map((d) => escapeRegExp(d)).join("")}]+`
  );
  return str.split(pattern).filter(Boolean);
}

/**
 * Escape special regex characters
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeRegExp(str) {
  if (typeof str !== "string") {
    return "";
  }

  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Convert camelCase to kebab-case
 * @param {string} str - CamelCase string
 * @returns {string} kebab-case string
 */
export function camelToKebab(str) {
  if (typeof str !== "string") {
    return "";
  }

  return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

/**
 * Convert kebab-case to camelCase
 * @param {string} str - kebab-case string
 * @returns {string} camelCase string
 */
export function kebabToCamel(str) {
  if (typeof str !== "string") {
    return "";
  }

  return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
}

/**
 * Check if string contains only specific characters
 * @param {string} str - String to check
 * @param {RegExp|string} allowedPattern - Allowed character pattern
 * @returns {boolean} True if string contains only allowed characters
 */
export function containsOnly(str, allowedPattern) {
  if (typeof str !== "string") {
    return false;
  }

  if (typeof allowedPattern === "string") {
    // Convert string to character class regex
    const escaped = escapeRegExp(allowedPattern);
    allowedPattern = new RegExp(`^[${escaped}]*$`);
  }

  return allowedPattern instanceof RegExp ? allowedPattern.test(str) : false;
}

/**
 * Remove multiple consecutive whitespace characters
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
export function normalizeWhitespace(str) {
  if (typeof str !== "string") {
    return "";
  }

  return str.replace(/\s+/g, " ").trim();
}

/**
 * Check if string is empty or contains only whitespace
 * @param {string} str - String to check
 * @returns {boolean} True if empty or whitespace only
 */
export function isBlank(str) {
  return typeof str !== "string" || str.trim().length === 0;
}
