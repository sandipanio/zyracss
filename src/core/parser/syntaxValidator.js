/**
 * Syntax validation and CSS selector generation
 * Handles class name validation and CSS selector escaping with safe regex execution
 */

import { escapeCSSSelector } from "../utils/cssUtils.js";
import { syncSafeRegexTest, REGEX_TIMEOUTS } from "../security/safeRegex.js";

/**
 * Validate class syntax - supports both bracket and shorthand syntax with timeout protection
 * Examples: p-[24px], bg-[#111], p-24px, w-100%, bg-red
 * @param {string} className - Class name to validate
 * @returns {boolean} True if valid syntax
 */
export function validateClassSyntax(className) {
  if (!className || typeof className !== "string") {
    return false;
  }

  // Enhanced pattern to support both bracket and shorthand syntax
  // - Starts with letter
  // - Can contain letters, numbers, hyphens
  // - Ends with either:
  //   - Bracket syntax: -[value] where value can contain anything except ]
  //   - Shorthand syntax: -value where value doesn't contain spaces, quotes, or angle brackets
  const validPattern = /^[a-zA-Z][a-zA-Z0-9-]*(?:-\[[^\]]+\]|-[^ \t"'<>]+)?$/;

  const testResult = syncSafeRegexTest(validPattern, className, {
    timeout: REGEX_TIMEOUTS.FAST,
  });
  return (
    testResult.result === true && !testResult.error && !testResult.timedOut
  );
}

/**
 * Generate CSS selector with proper escaping
 * Uses centralized escaping function for consistency
 * @param {string} className - The class name to escape
 * @returns {string} Escaped CSS selector
 */
export function generateSelector(className) {
  return `.${escapeCSSSelector(className)}`;
}
