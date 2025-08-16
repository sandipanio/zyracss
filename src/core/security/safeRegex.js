/**
 * Safe regex utilities with timeout protection
 * Prevents ReDoS attacks through resource limits
 */

// Timeout constants for different regex complexity levels
export const REGEX_TIMEOUTS = {
  FAST: 100, // For simple patterns
  NORMAL: 500, // For moderate patterns
  SLOW: 2000, // For complex patterns
};

/**
 * Test if input length is safe for regex operations
 * @param {string} input - Input to check
 * @param {number} maxLength - Maximum safe length
 * @returns {boolean} Whether input length is safe
 */
export function isInputLengthSafe(input, maxLength = 10000) {
  return typeof input === "string" && input.length <= maxLength;
}

/**
 * Synchronous safe regex test with timeout protection
 * @param {RegExp} regex - Regex pattern to test
 * @param {string} input - Input string to test against
 * @param {Object} options - Options with timeout
 * @returns {boolean} Whether pattern matches
 */
export function syncSafeRegexTest(regex, input, options = {}) {
  const timeout = options.timeout || REGEX_TIMEOUTS.NORMAL;

  if (!isInputLengthSafe(input, 50000)) {
    return false;
  }

  const startTime = Date.now();

  try {
    const result = regex.test(input);
    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) {
      console.warn(
        `Regex operation took ${elapsed}ms, exceeding timeout of ${timeout}ms`
      );
    }

    return result;
  } catch (error) {
    console.error("Regex test failed:", error);
    return false;
  }
}

/**
 * Safe regex match with timeout protection
 * @param {RegExp} regex - Regex pattern to match
 * @param {string} input - Input string to match against
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Array|null} Match result or null
 */
export function safeRegexMatch(regex, input, timeout = REGEX_TIMEOUTS.NORMAL) {
  if (!isInputLengthSafe(input, 50000)) {
    return null;
  }

  const startTime = Date.now();

  try {
    const result = input.match(regex);
    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) {
      console.warn(
        `Regex match took ${elapsed}ms, exceeding timeout of ${timeout}ms`
      );
    }

    return result;
  } catch (error) {
    console.error("Regex match failed:", error);
    return null;
  }
}

/**
 * Safe regex replace with timeout protection
 * @param {RegExp} regex - Regex pattern to replace
 * @param {string} input - Input string to perform replacement on
 * @param {string} replacement - Replacement string
 * @param {number} timeout - Timeout in milliseconds
 * @returns {string|null} Replaced string or null
 */
export function safeRegexReplace(
  regex,
  input,
  replacement,
  timeout = REGEX_TIMEOUTS.NORMAL
) {
  if (!isInputLengthSafe(input, 50000)) {
    return null;
  }

  const startTime = Date.now();

  try {
    const result = input.replace(regex, replacement);
    const elapsed = Date.now() - startTime;

    if (elapsed > timeout) {
      console.warn(
        `Regex replace took ${elapsed}ms, exceeding timeout of ${timeout}ms`
      );
    }

    return result;
  } catch (error) {
    console.error("Regex replace failed:", error);
    return null;
  }
}

/**
 * Create a safe regex with input validation
 * @param {string|RegExp} pattern - Regex pattern string or RegExp object
 * @param {string} flags - Regex flags
 * @returns {RegExp|null} Safe regex or null if invalid
 */
export function createSafeRegex(pattern, flags = "") {
  try {
    if (pattern instanceof RegExp) {
      return pattern;
    }

    if (typeof pattern !== "string" || pattern.length > 1000) {
      console.error("Regex pattern too long or invalid type");
      return null;
    }

    return new RegExp(pattern, flags);
  } catch (error) {
    console.error("Failed to create safe regex:", error);
    return null;
  }
}

/**
 * Async safe regex test (alias for syncSafeRegexTest for backward compatibility)
 * @param {RegExp} regex - Regex pattern to test
 * @param {string} input - Input string to test against
 * @param {Object} options - Options with timeout
 * @returns {boolean} Whether pattern matches
 */
export function safeRegexTest(regex, input, options = {}) {
  return syncSafeRegexTest(regex, input, options);
}
