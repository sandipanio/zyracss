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
 * Truncate string with ellipsis
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated string
 */
export function truncate(str, maxLength, suffix = "...") {
  if (typeof str !== "string") {
    return "";
  }

  if (str.length <= maxLength) {
    return str;
  }

  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Count occurrences of substring
 * @param {string} str - String to search in
 * @param {string} substr - Substring to count
 * @returns {number} Number of occurrences
 */
export function countOccurrences(str, substr) {
  if (
    typeof str !== "string" ||
    typeof substr !== "string" ||
    substr.length === 0
  ) {
    return 0;
  }

  let count = 0;
  let index = 0;

  while ((index = str.indexOf(substr, index)) !== -1) {
    count++;
    index += substr.length;
  }

  return count;
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
 * Extract words from string (alphanumeric + hyphens)
 * @param {string} str - String to extract words from
 * @returns {Array<string>} Array of words
 */
export function extractWords(str) {
  if (typeof str !== "string") {
    return [];
  }

  const matches = str.match(/[a-zA-Z0-9-]+/g);
  return matches || [];
}

/**
 * Check if string is empty or contains only whitespace
 * @param {string} str - String to check
 * @returns {boolean} True if empty or whitespace only
 */
export function isBlank(str) {
  return typeof str !== "string" || str.trim().length === 0;
}

/**
 * Pad string to specified length
 * @param {string} str - String to pad
 * @param {number} length - Target length
 * @param {string} padChar - Character to pad with
 * @param {string} direction - 'left', 'right', or 'both'
 * @returns {string} Padded string
 */
export function padString(str, length, padChar = " ", direction = "right") {
  if (typeof str !== "string") {
    str = String(str);
  }

  if (str.length >= length) {
    return str;
  }

  const padLength = length - str.length;
  const padding = padChar.repeat(Math.ceil(padLength / padChar.length));

  switch (direction) {
    case "left":
      return (padding + str).slice(-length);
    case "both":
      const leftPad = Math.floor(padLength / 2);
      const rightPad = padLength - leftPad;
      return padding.slice(0, leftPad) + str + padding.slice(0, rightPad);
    case "right":
    default:
      return (str + padding).slice(0, length);
  }
}
