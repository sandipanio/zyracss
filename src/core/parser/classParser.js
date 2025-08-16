/**
 * Updated Parser with consistent error handling and caching
 * Integrates with new error handling and caching systems with safe regex execution
 */

import { PROPERTY_MAP } from "../maps/index.js";
import {
  sanitizeInput,
  detectDangerousPatterns,
  isSafeInput,
} from "../security/index.js";
import {
  syncSafeRegexTest,
  safeRegexMatch,
  REGEX_TIMEOUTS,
} from "../security/safeRegex.js";
import { parseCSSSyntax } from "./valueParser.js";
import { generateSelector } from "./syntaxValidator.js";
import {
  ZyraResult,
  ZyraError,
  ErrorFactory,
  ValidationResult,
  ParseResult,
} from "../errors/index.js";
import { withParseCache } from "../cache/index.js";

/**
 * Enhanced class parser with consistent error handling
 * @param {string} className - The utility class to parse
 * @returns {ZyraResult} Result containing parsed class or error
 */
function parseClassCore(className) {
  // Input validation
  if (!className || typeof className !== "string") {
    return ZyraResult.error(
      ErrorFactory.invalidInput(
        className,
        "Class name must be a non-empty string"
      )
    );
  }

  // Security sanitization
  const sanitized = sanitizeInput(className);
  if (!sanitized) {
    return ZyraResult.error(
      ErrorFactory.dangerousInput(className, ["Contains dangerous characters"])
    );
  }

  // Comprehensive security validation
  const securityCheck = detectDangerousPatterns(sanitized);
  if (securityCheck.isDangerous) {
    const patterns = securityCheck.matchedPatterns.map(
      (p) => `${p.name} (${p.riskLevel})`
    );
    const suggestions = securityCheck.matchedPatterns.flatMap((p) =>
      p.description ? [`Avoid: ${p.description}`] : []
    );
    return ZyraResult.error(
      ErrorFactory.dangerousInput(
        className,
        patterns,
        suggestions.length ? suggestions : undefined
      )
    );
  }

  // Syntax validation
  const syntaxValidation = validateClassSyntax(sanitized);
  if (!syntaxValidation.isValid) {
    return ZyraResult.error(
      ErrorFactory.invalidClassSyntax(
        sanitized,
        syntaxValidation.reason,
        syntaxValidation.suggestions
      )
    );
  }

  // Parse based on syntax type with safe regex - ONLY bracket syntax
  const bracketMatchResult = safeRegexMatch(
    /^([a-zA-Z-]+)-\[([^\]]+)\]$/,
    sanitized,
    REGEX_TIMEOUTS.FAST
  );
  if (
    bracketMatchResult.matches &&
    !bracketMatchResult.error &&
    !bracketMatchResult.timedOut
  ) {
    return parseBracketSyntax(
      bracketMatchResult.matches[1],
      bracketMatchResult.matches[2]
    );
  }

  return ZyraResult.error(
    ErrorFactory.invalidClassSyntax(sanitized, "Unknown syntax pattern", [
      "Use bracket syntax: property-[value]",
    ])
  );
}

/**
 * Enhanced syntax validation with detailed feedback
 * @param {string} className - Class name to validate
 * @returns {ValidationResult} Validation result with details
 */
function validateClassSyntax(className) {
  if (!className || typeof className !== "string") {
    return ValidationResult.invalid(
      ErrorFactory.invalidInput(className, "Must be a string")
    );
  }

  // Enhanced pattern to support ONLY bracket syntax
  const validPattern = /^[a-zA-Z][a-zA-Z0-9-]*-\[[^\]]+\]$/;

  const validPatternResult = syncSafeRegexTest(validPattern, className, {
    timeout: REGEX_TIMEOUTS.FAST,
  });
  if (
    !validPatternResult.result ||
    validPatternResult.error ||
    validPatternResult.timedOut
  ) {
    const suggestions = [];

    // Specific error analysis
    if (className.includes(" ")) {
      suggestions.push("Remove spaces from class name");
    }
    if (className.includes("[") && !className.includes("]")) {
      suggestions.push("Close bracket with ]");
    }
    if (!className.includes("[") && className.includes("]")) {
      suggestions.push("Open bracket with [");
    }

    const startsWithNumberResult = syncSafeRegexTest(/^[0-9]/, className, {
      timeout: REGEX_TIMEOUTS.FAST,
    });
    if (startsWithNumberResult.result && !startsWithNumberResult.error) {
      suggestions.push("Class names cannot start with numbers");
    }

    return ValidationResult.invalid(
      ErrorFactory.invalidClassSyntax(
        className,
        "Invalid character pattern",
        suggestions
      )
    );
  }

  return ValidationResult.valid(className);
}

/**
 * Parse bracket syntax with enhanced error handling
 * @param {string} prefix - Property prefix
 * @param {string} value - CSS value in brackets
 * @returns {ZyraResult} Parse result
 */
function parseBracketSyntax(prefix, value) {
  // Property resolution
  const property = PROPERTY_MAP.get(prefix);
  if (!property) {
    const availableProperties = getAvailableProperties(prefix);
    return ZyraResult.error(
      ErrorFactory.propertyNotSupported(prefix, availableProperties)
    );
  }

  // Value parsing with enhanced validation
  const valueParseResult = parseCSSSyntax(value);
  if (!valueParseResult) {
    return ZyraResult.error(
      ErrorFactory.invalidCSSValue(
        property,
        value,
        "Could not parse CSS value",
        ["Check for unmatched parentheses", "Verify CSS function syntax"]
      )
    );
  }

  // Create parsed class object
  const parsedClass = {
    className: `${prefix}-[${value}]`,
    prefix,
    property,
    value: valueParseResult.cssValue,
    rawValue: value,
    values: valueParseResult.values,
    syntax: "bracket",
    selector: generateSelector(`${prefix}-[${value}]`),
    isFunction: valueParseResult.isFunction,
    metadata: {
      parseTimestamp: Date.now(),
      fromCache: false,
    },
  };

  return ZyraResult.success(parsedClass);
}

/**
 * Get available properties for suggestions
 * @param {string} prefix - Attempted prefix
 * @returns {Array<string>} Similar available properties
 */
function getAvailableProperties(prefix) {
  const allPrefixes = Array.from(PROPERTY_MAP.keys());

  // Simple fuzzy matching - find prefixes that start with same letters
  const similar = allPrefixes
    .filter((p) => p.startsWith(prefix.charAt(0)))
    .sort((a, b) => {
      // Sort by similarity (Levenshtein would be better, but this is simple)
      const aDiff = Math.abs(a.length - prefix.length);
      const bDiff = Math.abs(b.length - prefix.length);
      return aDiff - bDiff;
    })
    .slice(0, 5);

  return similar;
}

/**
 * Parse multiple classes with comprehensive error handling
 * @param {Array|string} input - Classes to parse
 * @returns {ParseResult} Parse result with valid and invalid classes
 */
export function parseClasses(input) {
  let classes = [];

  // Input normalization
  if (Array.isArray(input)) {
    classes = input;
  } else if (typeof input === "string") {
    classes = input.trim().split(/\s+/).filter(Boolean);
  } else {
    return ParseResult.withInvalid(
      [],
      [ErrorFactory.invalidInput(input, "Input must be array or string")]
    );
  }

  const parsed = [];
  const invalid = [];
  const seen = new Set(); // Deduplication

  for (const className of classes) {
    // Skip duplicates
    if (seen.has(className)) continue;
    seen.add(className);

    // Parse individual class
    const parseResult = parseClass(className);

    if (parseResult.success) {
      parsed.push(parseResult.data);
    } else {
      invalid.push({
        className,
        error: parseResult.error,
        suggestions: parseResult.error.suggestions || [],
      });
    }
  }

  return ParseResult.withInvalid(parsed, invalid);
}

/**
 * Cache-enabled parse function
 */
export const parseClass = withParseCache(parseClassCore);

// Re-export other parser functions
export {
  extractClassesFromHTML,
  extractClassesFromHTMLArray,
} from "./htmlExtractor.js";

export { validateClassSyntax, generateSelector } from "./syntaxValidator.js";
export { parseCSSSyntax } from "./valueParser.js";
