/**
 * Error System - Main Index with Clean Exports
 * Provides centralized error handling with clean modular exports
 */

// ============================================================================
// CORE ERROR CLASSES
// ============================================================================

/**
 * Standard ZyraCSS Result type - used everywhere for consistency
 */
export class ZyraResult {
  constructor(success, data = null, error = null) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static success(data) {
    return new ZyraResult(true, data, null);
  }

  static error(error) {
    return new ZyraResult(false, null, error);
  }

  static fromTryCatch(fn, ...args) {
    try {
      const result = fn(...args);
      return ZyraResult.success(result);
    } catch (error) {
      return ZyraResult.error(ZyraError.fromException(error));
    }
  }

  static async fromTryCatchAsync(fn, ...args) {
    try {
      const result = await fn(...args);
      return ZyraResult.success(result);
    } catch (error) {
      return ZyraResult.error(ZyraError.fromException(error));
    }
  }

  then(fn) {
    if (!this.success) return this;

    try {
      const result = fn(this.data);
      return result instanceof ZyraResult ? result : ZyraResult.success(result);
    } catch (error) {
      return ZyraResult.error(ZyraError.fromException(error));
    }
  }

  catch(fn) {
    if (this.success) return this;

    try {
      const result = fn(this.error);
      return result instanceof ZyraResult ? result : ZyraResult.success(result);
    } catch (error) {
      return ZyraResult.error(ZyraError.fromException(error));
    }
  }

  unwrap() {
    if (!this.success) throw this.error;
    return this.data;
  }

  unwrapOr(defaultValue) {
    return this.success ? this.data : defaultValue;
  }
}

/**
 * Standard ZyraCSS Error class with context and suggestions
 */
export class ZyraError extends Error {
  constructor(code, message, context = {}, suggestions = []) {
    super(message);
    this.name = "ZyraError";
    this.code = code;
    this.context = context;
    this.suggestions = suggestions;
    this.timestamp = new Date().toISOString();
  }

  static fromException(error) {
    if (error instanceof ZyraError) return error;

    return new ZyraError("UNEXPECTED_ERROR", error.message, {
      originalError: error.name,
      stack: error.stack,
    });
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      suggestions: this.suggestions,
      timestamp: this.timestamp,
    };
  }
}

// ============================================================================
// ERROR CONSTANTS
// ============================================================================

export const ERROR_CODES = {
  // Input errors
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_CLASS_SYNTAX: "INVALID_CLASS_SYNTAX",
  INVALID_CSS_VALUE: "INVALID_CSS_VALUE",

  // Security errors
  DANGEROUS_INPUT: "DANGEROUS_INPUT",
  INPUT_TOO_LONG: "INPUT_TOO_LONG",

  // Processing errors
  PARSING_FAILED: "PARSING_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  GENERATION_FAILED: "GENERATION_FAILED",

  // System errors
  PROPERTY_NOT_SUPPORTED: "PROPERTY_NOT_SUPPORTED",
  UNEXPECTED_ERROR: "UNEXPECTED_ERROR",
};

// ============================================================================
// ERROR FACTORY
// ============================================================================

export class ErrorFactory {
  static invalidInput(input, reason, suggestions = []) {
    return new ZyraError(
      ERROR_CODES.INVALID_INPUT,
      `Invalid input: ${reason}`,
      { input, inputType: typeof input },
      suggestions
    );
  }

  static invalidClassSyntax(className, reason, suggestions = []) {
    return new ZyraError(
      ERROR_CODES.INVALID_CLASS_SYNTAX,
      `Invalid class syntax in "${className}": ${reason}`,
      { className },
      suggestions.length
        ? suggestions
        : [
            "Use bracket syntax: property-[value]",
            "Use shorthand syntax: property-value",
            "Check for unmatched brackets or invalid characters",
          ]
    );
  }

  static invalidCSSValue(property, value, reason, suggestions = []) {
    return new ZyraError(
      ERROR_CODES.INVALID_CSS_VALUE,
      `Invalid CSS value "${value}" for property "${property}": ${reason}`,
      { property, value },
      suggestions
    );
  }

  static dangerousInput(input, patterns, suggestions = []) {
    return new ZyraError(
      ERROR_CODES.DANGEROUS_INPUT,
      `Input contains dangerous patterns: ${patterns.join(", ")}`,
      { input, detectedPatterns: patterns },
      suggestions.length
        ? suggestions
        : [
            "Remove javascript: URLs",
            "Remove data: URLs",
            "Remove CSS expressions",
            "Use safe CSS values only",
          ]
    );
  }

  static parsingFailed(input, reason, suggestions = []) {
    return new ZyraError(
      ERROR_CODES.PARSING_FAILED,
      `Failed to parse input: ${reason}`,
      { input },
      suggestions
    );
  }

  static propertyNotSupported(property, availableProperties = []) {
    const suggestions = availableProperties.length
      ? [`Did you mean: ${availableProperties.slice(0, 3).join(", ")}?`]
      : ["Check the property mapping documentation"];

    return new ZyraError(
      ERROR_CODES.PROPERTY_NOT_SUPPORTED,
      `CSS property "${property}" is not supported`,
      { property, availableProperties },
      suggestions
    );
  }

  static generationFailed(className, reason, suggestions = []) {
    return new ZyraError(
      ERROR_CODES.GENERATION_FAILED,
      `Failed to generate CSS for "${className}": ${reason}`,
      { className },
      suggestions
    );
  }
}

// ============================================================================
// SPECIALIZED RESULT CLASSES
// ============================================================================

export class ValidationResult {
  constructor(isValid, value = null, errors = []) {
    this.isValid = isValid;
    this.value = value;
    this.errors = errors;
  }

  static valid(value) {
    return new ValidationResult(true, value, []);
  }

  static invalid(errors) {
    const errorArray = Array.isArray(errors) ? errors : [errors];
    return new ValidationResult(false, null, errorArray);
  }

  toZyraResult() {
    if (this.isValid) {
      return ZyraResult.success(this.value);
    } else {
      return ZyraResult.error(
        this.errors[0] ||
          new ZyraError("VALIDATION_FAILED", "Validation failed")
      );
    }
  }

  addError(error) {
    this.errors.push(error);
    this.isValid = false;
    return this;
  }
}

export class ParseResult {
  constructor(parsed = [], invalid = []) {
    this.parsed = parsed;
    this.invalid = invalid;
  }

  static success(parsed) {
    return new ParseResult(parsed, []);
  }

  static withInvalid(parsed, invalid) {
    return new ParseResult(parsed, invalid);
  }

  get isFullyValid() {
    return this.invalid.length === 0;
  }

  get hasAnyValid() {
    return this.parsed.length > 0;
  }

  toZyraResult() {
    if (this.hasAnyValid) {
      return ZyraResult.success({
        parsed: this.parsed,
        invalid: this.invalid,
        stats: {
          total: this.parsed.length + this.invalid.length,
          valid: this.parsed.length,
          invalid: this.invalid.length,
        },
      });
    } else {
      return ZyraResult.error(
        new ZyraError(
          ERROR_CODES.PARSING_FAILED,
          "No valid classes could be parsed",
          { totalInput: this.invalid.length }
        )
      );
    }
  }
}

export class CSSGenerationResult {
  constructor(css = "", rules = [], invalid = [], stats = {}) {
    this.css = css;
    this.rules = rules;
    this.invalid = invalid;
    this.stats = {
      totalInput: 0,
      validClasses: 0,
      invalidClasses: 0,
      generatedRules: 0,
      processingTime: 0,
      ...stats,
    };
  }

  static success(css, rules, stats = {}) {
    return new CSSGenerationResult(css, rules, [], stats);
  }

  static withInvalid(css, rules, invalid, stats = {}) {
    return new CSSGenerationResult(css, rules, invalid, stats);
  }

  static empty(reason = "No valid classes provided") {
    return new CSSGenerationResult("", [], [], { error: reason });
  }

  get hasCSS() {
    return this.css.length > 0;
  }

  get hasInvalid() {
    return this.invalid.length > 0;
  }

  toZyraResult() {
    if (this.hasCSS || this.rules.length > 0) {
      return ZyraResult.success({
        css: this.css,
        rules: this.rules,
        invalid: this.invalid,
        stats: this.stats,
      });
    } else {
      return ZyraResult.error(
        new ZyraError(
          ERROR_CODES.GENERATION_FAILED,
          "No CSS could be generated",
          { stats: this.stats }
        )
      );
    }
  }
}

// ============================================================================
// GLOBAL ERROR HANDLER (Optional for production)
// ============================================================================

export class GlobalErrorHandler {
  static logError(error, context = {}) {
    const errorInfo = {
      timestamp: new Date().toISOString(),
      error:
        error instanceof ZyraError
          ? error.toJSON()
          : {
              name: error.name,
              message: error.message,
              stack: error.stack,
            },
      context,
    };

    if (process.env.NODE_ENV === "development") {
      console.error("ZyraCSS Error:", errorInfo);
    }
  }

  static handlePromiseRejection(error, context = {}) {
    this.logError(error, { ...context, type: "unhandled_promise_rejection" });
  }

  static handleUncaughtException(error, context = {}) {
    this.logError(error, { ...context, type: "uncaught_exception" });
  }
}

// Set up global error handlers (optional)
if (typeof process !== "undefined") {
  process.on("unhandledRejection", (error, promise) => {
    GlobalErrorHandler.handlePromiseRejection(error, { promise });
  });

  process.on("uncaughtException", (error) => {
    GlobalErrorHandler.handleUncaughtException(error);
  });
}
