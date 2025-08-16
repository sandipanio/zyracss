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
  const bracketMatches = safeRegexMatch(
    /^([a-zA-Z-]+)-\[([^\]]+)\]$/,
    sanitized,
    REGEX_TIMEOUTS.FAST
  );
  if (bracketMatches && bracketMatches.length >= 3) {
    return parseBracketSyntax(bracketMatches[1], bracketMatches[2]);
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

  const isValid = syncSafeRegexTest(validPattern, className, {
    timeout: REGEX_TIMEOUTS.FAST,
  });

  if (!isValid) {
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

    const startsWithNumber = syncSafeRegexTest(/^[0-9]/, className, {
      timeout: REGEX_TIMEOUTS.FAST,
    });
    if (startsWithNumber) {
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
  // Smart property resolution for ambiguous prefixes
  let property = PROPERTY_MAP.get(prefix);

  // Special handling for 'text' prefix - can be color or font-size
  if (prefix === "text" && !property) {
    // Try to detect based on value pattern
    if (isColorValue(value)) {
      property = "color";
    } else if (isSizeValue(value)) {
      property = "font-size";
    } else {
      property = "color"; // Default to color for 'text'
    }
  } else if (prefix === "text" && property) {
    // If 'text' maps to 'color' but value looks like size, use font-size
    if (property === "color" && isSizeValue(value)) {
      property = "font-size";
    }
  }

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
 * Check if a value looks like a color
 * @param {string} value - CSS value to check
 * @returns {boolean} True if value looks like a color
 */
function isColorValue(value) {
  // Check for common color patterns
  return (
    value.startsWith("#") || // #fff, #ffffff
    value.startsWith("rgb") || // rgb(), rgba()
    value.startsWith("hsl") || // hsl(), hsla()
    value.match(/^[a-z]+$/i) || // named colors like 'red', 'blue'
    value.includes("var(--") // CSS custom properties for colors
  );
}

/**
 * Check if a value looks like a size/length
 * @param {string} value - CSS value to check
 * @returns {boolean} True if value looks like a size
 */
function isSizeValue(value) {
  // Check for common size unit patterns
  return (
    /^\d+(\.\d+)?(px|em|rem|%|vw|vh|pt|pc|in|cm|mm|ex|ch|vmin|vmax)$/i.test(
      value
    ) || /^\d+(\.\d+)?$/.test(value)
  ); // unitless numbers
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
