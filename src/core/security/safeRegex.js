/**
 * Safe regex execution with timeout protection
 * Prevents ReDoS (Regular Expression Denial of Service) attacks
 */

/**
 * Default timeout for regex operations (milliseconds)
 */
const DEFAULT_REGEX_TIMEOUT = 100;
const MAX_REGEX_TIMEOUT = 1000;

/**
 * Safe regex tester with timeout protection
 * @param {RegExp} regex - The regex pattern to test
 * @param {string} input - Input string to test against
 * @param {number} timeout - Timeout in milliseconds (default: 100)
 * @returns {Object} Result object with success/timeout information
 */
export function safeRegexTest(regex, input, timeout = DEFAULT_REGEX_TIMEOUT) {
  if (typeof input !== "string") {
    return { result: false, timedOut: false, error: "Invalid input type" };
  }

  // Enforce maximum timeout
  const actualTimeout = Math.min(timeout, MAX_REGEX_TIMEOUT);

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve({ result: false, timedOut: true, error: "Regex timeout" });
    }, actualTimeout);

    try {
      const result = regex.test(input);
      clearTimeout(timer);
      resolve({ result, timedOut: false, error: null });
    } catch (error) {
      clearTimeout(timer);
      resolve({ result: false, timedOut: false, error: error.message });
    }
  });
}

/**
 * Synchronous safe regex test with length-based early termination
 * @param {RegExp} regex - The regex pattern to test
 * @param {string} input - Input string to test against
 * @param {Object} options - Configuration options
 * @returns {Object} Result object
 */
export function syncSafeRegexTest(regex, input, options = {}) {
  const {
    maxLength = 10000,
    timeout = DEFAULT_REGEX_TIMEOUT,
    allowUnsafe = false,
  } = options;

  if (typeof input !== "string") {
    return { result: false, timedOut: false, error: "Invalid input type" };
  }

  // Early termination for overly long inputs that could cause ReDoS
  if (input.length > maxLength && !allowUnsafe) {
    return {
      result: false,
      timedOut: false,
      error: `Input too long (${input.length} > ${maxLength})`,
    };
  }

  // Check for potentially dangerous regex patterns
  const regexSource = regex.source || regex.toString();
  if (isDangerousRegex(regexSource) && !allowUnsafe) {
    return {
      result: false,
      timedOut: false,
      error: "Potentially unsafe regex pattern detected",
    };
  }

  const startTime = Date.now();

  try {
    const result = regex.test(input);
    const duration = Date.now() - startTime;

    if (duration > timeout) {
      return {
        result: false,
        timedOut: true,
        error: `Regex execution took too long (${duration}ms > ${timeout}ms)`,
      };
    }

    return { result, timedOut: false, error: null, duration };
  } catch (error) {
    return { result: false, timedOut: false, error: error.message };
  }
}

/**
 * Safe regex match with timeout protection
 * @param {RegExp} regex - The regex pattern
 * @param {string} input - Input string
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} Match result
 */
export function safeRegexMatch(regex, input, timeout = DEFAULT_REGEX_TIMEOUT) {
  if (typeof input !== "string") {
    return { matches: null, timedOut: false, error: "Invalid input type" };
  }

  const startTime = Date.now();

  try {
    const matches = input.match(regex);
    const duration = Date.now() - startTime;

    if (duration > timeout) {
      return {
        matches: null,
        timedOut: true,
        error: `Regex match took too long (${duration}ms > ${timeout}ms)`,
      };
    }

    return { matches, timedOut: false, error: null, duration };
  } catch (error) {
    return { matches: null, timedOut: false, error: error.message };
  }
}

/**
 * Safe regex replace with timeout protection
 * @param {RegExp} regex - The regex pattern
 * @param {string} input - Input string
 * @param {string|function} replacement - Replacement string or function
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Object} Replace result
 */
export function safeRegexReplace(
  regex,
  input,
  replacement,
  timeout = DEFAULT_REGEX_TIMEOUT
) {
  if (typeof input !== "string") {
    return { result: input, timedOut: false, error: "Invalid input type" };
  }

  const startTime = Date.now();

  try {
    const result = input.replace(regex, replacement);
    const duration = Date.now() - startTime;

    if (duration > timeout) {
      return {
        result: input,
        timedOut: true,
        error: `Regex replace took too long (${duration}ms > ${timeout}ms)`,
      };
    }

    return { result, timedOut: false, error: null, duration };
  } catch (error) {
    return { result: input, timedOut: false, error: error.message };
  }
}

/**
 * Check if a regex pattern is potentially dangerous (ReDoS vulnerable)
 * @param {string} regexSource - The regex source string
 * @returns {boolean} True if potentially dangerous
 */
function isDangerousRegex(regexSource) {
  const dangerousPatterns = [
    // Nested quantifiers (e.g., (a+)+)
    /\([^)]*\+[^)]*\)\+/,
    /\([^)]*\*[^)]*\)\*/,
    /\([^)]*\+[^)]*\)\{/,
    /\([^)]*\*[^)]*\)\{/,

    // Alternation with repetition (e.g., (a|a)*b)
    /\([^|]*\|[^)]*\)[\+\*\{]/,

    // Complex nested groups with quantifiers
    /\([^)]*\([^)]*\)[\+\*][^)]*\)[\+\*]/,
  ];

  return dangerousPatterns.some((pattern) => pattern.test(regexSource));
}

/**
 * Create a safe regex wrapper that automatically applies timeout protection
 * @param {RegExp} regex - Original regex
 * @param {Object} options - Configuration options
 * @returns {Object} Safe regex wrapper
 */
export function createSafeRegex(regex, options = {}) {
  const { timeout = DEFAULT_REGEX_TIMEOUT, maxLength = 10000 } = options;

  return {
    test: (input) => syncSafeRegexTest(regex, input, { timeout, maxLength }),
    match: (input) => safeRegexMatch(regex, input, timeout),
    replace: (input, replacement) =>
      safeRegexReplace(regex, input, replacement, timeout),
    exec: (input) => {
      const matchResult = safeRegexMatch(regex, input, timeout);
      return matchResult.timedOut ? null : matchResult.matches;
    },
    source: regex.source,
    flags: regex.flags,
  };
}

/**
 * Regex timeout configuration
 */
export const REGEX_TIMEOUTS = {
  FAST: 50, // For simple validations
  NORMAL: 100, // Default timeout
  SLOW: 300, // For complex parsing
  MAXIMUM: 1000, // Maximum allowed timeout
};

/**
 * Pre-validate input length before regex operations
 * @param {string} input - Input to validate
 * @param {number} maxLength - Maximum allowed length
 * @returns {boolean} True if input length is safe
 */
export function isInputLengthSafe(input, maxLength = 10000) {
  return typeof input === "string" && input.length <= maxLength;
}
