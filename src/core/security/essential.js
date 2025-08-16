/**
 * Essential security re-exports for optimized imports
 * Provides lightweight access to critical security functions
 */

// Safe regex utilities - core security functionality
export {
  safeRegexTest,
  syncSafeRegexTest,
  safeRegexMatch,
  safeRegexReplace,
  createSafeRegex,
  isInputLengthSafe,
  REGEX_TIMEOUTS,
} from "./safeRegex.js";

// Input sanitization - frequently used
export {
  sanitizeInput,
  sanitizeValue,
  needsSanitization,
} from "./inputSanitizer.js";

// Pattern detection - essential security
export {
  detectDangerousPatterns,
  isSafeInput,
  testAgainstPattern,
} from "./patternDetector.js";

// Security constants - critical patterns
export {
  MAX_CLASS_LENGTH,
  MAX_VALUE_LENGTH,
  DANGEROUS_PATTERNS,
} from "./securityConstants.js";
