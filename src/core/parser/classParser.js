/**
 * Updated Parser with consistent error handling and caching
 * Integrates with new error handling and caching systems
 */

import { PROPERTY_MAP } from "../maps/index.js";
import { sanitizeInput } from "../security/index.js";
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

  // Parse based on syntax type
  const bracketMatch = sanitized.match(/^([a-zA-Z-]+)-\[([^\]]+)\]$/);
  if (bracketMatch) {
    return parseBracketSyntax(bracketMatch[1], bracketMatch[2]);
  }

  const shorthandMatch = sanitized.match(/^([a-zA-Z-]+)-([a-zA-Z0-9#.-]+)$/);
  if (shorthandMatch) {
    return parseShorthandSyntax(shorthandMatch[1], shorthandMatch[2]);
  }

  return ZyraResult.error(
    ErrorFactory.invalidClassSyntax(sanitized, "Unknown syntax pattern", [
      "Use bracket syntax: property-[value]",
      "Use shorthand syntax: property-value",
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

  // Enhanced pattern to support both bracket and shorthand syntax
  const validPattern = /^[a-zA-Z][a-zA-Z0-9-]*(?:-\[[^\]]+\]|-[^ \t"'<>]+)?$/;

  if (!validPattern.test(className)) {
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
    if (/^[0-9]/.test(className)) {
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
 * Parse shorthand syntax with enhanced error handling
 * @param {string} prefix - Property prefix
 * @param {string} value - CSS value
 * @returns {ZyraResult} Parse result
 */
function parseShorthandSyntax(prefix, value) {
  // Property resolution
  const property = PROPERTY_MAP.get(prefix);
  if (!property) {
    const availableProperties = getAvailableProperties(prefix);
    return ZyraResult.error(
      ErrorFactory.propertyNotSupported(prefix, availableProperties)
    );
  }

  // Basic value validation for shorthand
  if (!isValidShorthandValue(value)) {
    return ZyraResult.error(
      ErrorFactory.invalidCSSValue(
        property,
        value,
        "Invalid shorthand value format",
        [
          "Use simple values without spaces",
          "Complex values need bracket syntax",
        ]
      )
    );
  }

  // Create parsed class object
  const parsedClass = {
    className: `${prefix}-${value}`,
    prefix,
    property,
    value,
    rawValue: value,
    values: [value],
    syntax: "shorthand",
    selector: generateSelector(`${prefix}-${value}`),
    isFunction: false,
    metadata: {
      parseTimestamp: Date.now(),
      fromCache: false,
    },
  };

  return ZyraResult.success(parsedClass);
}

/**
 * Validate shorthand CSS value
 * @param {string} value - Value to validate
 * @returns {boolean} True if valid shorthand value
 */
function isValidShorthandValue(value) {
  // Shorthand values should be simple (no spaces, quotes, or complex syntax)
  return /^[a-zA-Z0-9#.%-]+$/.test(value);
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
