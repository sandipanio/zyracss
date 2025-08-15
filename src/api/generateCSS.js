/**
 * API with consistent error handling and real caching
 * Main programmatic API for ZyraCSS with enhanced reliability
 */

import { parseClasses } from "../core/parser/index.js";
import { extractClassesFromHTMLArray } from "../core/parser/htmlExtractor.js";
import { generateCSS as generateCSSCore } from "../core/generator/index.js";
import { sanitizeInputArray } from "../core/security/index.js";
import { now } from "../core/utils/index.js";
import {
  ZyraResult,
  ErrorFactory,
  CSSGenerationResult,
} from "../core/errors/errorSystem.js";
import { withGenerationCache, globalCache } from "../core/cache/cacheSystem.js";

/**
 * Enhanced CSS generation with comprehensive error handling and caching
 * @param {Object} input - Input configuration
 * @param {Array} [input.classes] - Array of utility class names
 * @param {Array} [input.html] - Array of HTML strings to scan for classes
 * @param {Object} [input.options] - Generation options
 * @returns {Promise<ZyraResult>} Result containing CSS generation data or error
 */
async function generateCSSCore(input = {}) {
  const startTime = now();

  try {
    // Input validation
    const inputValidation = validateGenerateInput(input);
    if (!inputValidation.success) {
      return inputValidation;
    }

    const { classes = [], html = [], options = {} } = input;

    // Step 1: Collect all classes from various sources
    const classCollectionResult = await collectAllClasses(classes, html);
    if (!classCollectionResult.success) {
      return classCollectionResult;
    }

    const { allClasses, extractionStats } = classCollectionResult.data;

    // Step 2: Early exit if no classes
    if (allClasses.length === 0) {
      return ZyraResult.success(
        CSSGenerationResult.empty("No classes provided")
      );
    }

    // Step 3: Security validation and sanitization
    const securityResult = performSecurityValidation(allClasses);
    if (!securityResult.success) {
      return securityResult;
    }

    const { validClasses, securityIssues } = securityResult.data;

    // Step 4: Parse classes with error collection
    const parseResult = parseClasses(validClasses);
    if (!parseResult.hasAnyValid) {
      return ZyraResult.error(
        ErrorFactory.parsingFailed(
          "All classes failed to parse",
          "No valid utility classes found"
        )
      );
    }

    // Step 5: Generate CSS with caching
    const generationResult = await generateCSSWithCaching(
      parseResult.parsed,
      options,
      startTime
    );

    if (!generationResult.success) {
      return generationResult;
    }

    // Step 6: Compile final result
    const finalResult = compileFinalResult(
      generationResult.data,
      parseResult.invalid,
      securityIssues,
      extractionStats,
      startTime
    );

    return ZyraResult.success(finalResult);
  } catch (error) {
    return ZyraResult.error(
      ErrorFactory.parsingFailed(
        "Unexpected error during CSS generation",
        error.message
      )
    );
  }
}

/**
 * Validate generateCSS input parameters
 * @param {Object} input - Input to validate
 * @returns {ZyraResult} Validation result
 */
function validateGenerateInput(input) {
  if (!input || typeof input !== "object") {
    return ZyraResult.error(
      ErrorFactory.invalidInput(input, "Input must be an object")
    );
  }

  const { classes, html, options } = input;

  // Validate classes array
  if (classes !== undefined && !Array.isArray(classes)) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(classes, "classes must be an array")
    );
  }

  // Validate HTML array
  if (html !== undefined && !Array.isArray(html)) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(html, "html must be an array")
    );
  }

  // Validate options object
  if (options !== undefined && typeof options !== "object") {
    return ZyraResult.error(
      ErrorFactory.invalidInput(options, "options must be an object")
    );
  }

  return ZyraResult.success(input);
}

/**
 * Collect classes from all input sources
 * @param {Array} classes - Direct class array
 * @param {Array} html - HTML strings to extract from
 * @returns {Promise<ZyraResult>} Result with collected classes
 */
async function collectAllClasses(classes, html) {
  try {
    const allClasses = [...(classes || [])];
    let extractedCount = 0;

    // Extract classes from HTML if provided
    if (html && html.length > 0) {
      // Validate HTML inputs
      const validHTML = html.filter((h) => typeof h === "string" && h.trim());

      if (validHTML.length > 0) {
        const extractedClasses = extractClassesFromHTMLArray(validHTML);
        allClasses.push(...extractedClasses);
        extractedCount = extractedClasses.length;
      }
    }

    return ZyraResult.success({
      allClasses,
      extractionStats: {
        directClasses: classes ? classes.length : 0,
        extractedClasses: extractedCount,
        totalClasses: allClasses.length,
      },
    });
  } catch (error) {
    return ZyraResult.error(
      ErrorFactory.parsingFailed(
        "Failed to collect classes from input sources",
        error.message
      )
    );
  }
}

/**
 * Perform security validation on collected classes
 * @param {Array} allClasses - All collected classes
 * @returns {ZyraResult} Security validation result
 */
function performSecurityValidation(allClasses) {
  try {
    // Sanitize inputs for security
    const { sanitized, failed } = sanitizeInputArray(allClasses);

    // Create security issues list
    const securityIssues = failed.map((failedClass) => ({
      className: failedClass,
      reason: "Failed security validation",
      type: "security",
    }));

    return ZyraResult.success({
      validClasses: sanitized,
      securityIssues,
    });
  } catch (error) {
    return ZyraResult.error(
      ErrorFactory.dangerousInput(
        allClasses,
        ["Security validation failed"],
        ["Review input for dangerous patterns"]
      )
    );
  }
}

/**
 * Generate CSS with intelligent caching
 * @param {Array} parsedClasses - Parsed class objects
 * @param {Object} options - Generation options
 * @param {number} startTime - Start time for performance tracking
 * @returns {Promise<ZyraResult>} CSS generation result
 */
async function generateCSSWithCaching(parsedClasses, options, startTime) {
  try {
    // Create cache key from parsed classes and options
    const classNames = parsedClasses.map((pc) => pc.className);

    // Check cache first
    const cached = globalCache.getCachedGeneratedCSS(classNames, options);
    if (cached) {
      return ZyraResult.success({
        css: cached.css,
        rules: cached.rules,
        stats: {
          ...cached.stats,
          fromCache: true,
          processingTime: now() - startTime,
        },
      });
    }

    // Generate CSS (expensive operation)
    const result = generateCSSCore(parsedClasses, options);

    if (!result || !result.css) {
      return ZyraResult.error(
        ErrorFactory.generationFailed(
          classNames.join(", "),
          "CSS generation returned empty result"
        )
      );
    }

    // Cache the result for future use
    globalCache.cacheGeneratedCSS(classNames, options, result);

    return ZyraResult.success({
      css: result.css,
      rules: result.stats?.rules || [],
      stats: {
        ...result.stats,
        fromCache: false,
        processingTime: now() - startTime,
      },
    });
  } catch (error) {
    return ZyraResult.error(
      ErrorFactory.generationFailed("CSS generation process", error.message)
    );
  }
}

/**
 * Compile final result with all statistics and errors
 * @param {Object} generationData - CSS generation data
 * @param {Array} parseErrors - Parse errors
 * @param {Array} securityIssues - Security issues
 * @param {Object} extractionStats - Extraction statistics
 * @param {number} startTime - Start time
 * @returns {CSSGenerationResult} Final compiled result
 */
function compileFinalResult(
  generationData,
  parseErrors,
  securityIssues,
  extractionStats,
  startTime
) {
  // Combine all invalid items
  const allInvalid = [
    ...parseErrors.map((pe) => ({
      className: pe.className,
      reason: pe.error.message,
      type: "parse_error",
      suggestions: pe.suggestions,
    })),
    ...securityIssues,
  ];

  // Compile comprehensive statistics
  const stats = {
    totalInput: extractionStats.totalClasses,
    directClasses: extractionStats.directClasses,
    extractedClasses: extractionStats.extractedClasses,
    validClasses: generationData.stats?.totalClasses || 0,
    invalidClasses: allInvalid.length,
    generatedRules: generationData.stats?.totalRules || 0,
    groupedRules: generationData.stats?.groupedRules || 0,
    compressionRatio: generationData.stats?.compressionRatio || 1,
    processingTime: now() - startTime,
    fromCache: generationData.stats?.fromCache || false,
    cacheStats: globalCache.getStats(),
  };

  return CSSGenerationResult.withInvalid(
    generationData.css,
    generationData.rules,
    allInvalid,
    stats
  );
}

/**
 * Apply caching to the core generation function
 */
export const generateCSS = withGenerationCache(generateCSSCore);

/**
 * Generate CSS from a single HTML string (convenience method)
 * @param {string} html - HTML string to scan
 * @param {Object} [options] - Generation options
 * @returns {Promise<ZyraResult>} Generated CSS result
 */
export async function generateCSSFromHTML(html, options = {}) {
  if (typeof html !== "string") {
    return ZyraResult.error(
      ErrorFactory.invalidInput(html, "HTML must be a string")
    );
  }

  return generateCSS({
    html: [html],
    options,
  });
}

/**
 * Generate CSS from an array of class names (convenience method)
 * @param {Array} classes - Array of utility class names
 * @param {Object} [options] - Generation options
 * @returns {Promise<ZyraResult>} Generated CSS result
 */
export async function generateCSSFromClasses(classes, options = {}) {
  if (!Array.isArray(classes)) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(classes, "Classes must be an array")
    );
  }

  return generateCSS({
    classes,
    options,
  });
}

/**
 * Validate classes without generating CSS
 * @param {Array<string>} classes - Array of class names to validate
 * @returns {Promise<ZyraResult>} Validation results only
 */
export async function validateClassNames(classes) {
  if (!Array.isArray(classes)) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(classes, "Classes must be an array")
    );
  }

  try {
    const startTime = now();

    // Security validation
    const { sanitized, failed } = sanitizeInputArray(classes);

    // Parse validation
    const parseResult = parseClasses(sanitized);

    const processingTime = now() - startTime;

    const result = {
      valid: parseResult.parsed.map((p) => p.className),
      invalid: [
        ...parseResult.invalid.map((inv) => ({
          className: inv.className,
          reason: inv.error.message,
          suggestions: inv.suggestions,
        })),
        ...failed.map((f) => ({
          className: f,
          reason: "Failed security validation",
          suggestions: ["Remove dangerous characters"],
        })),
      ],
      stats: {
        total: classes.length,
        validCount: parseResult.parsed.length,
        invalidCount: parseResult.invalid.length + failed.length,
        processingTime,
      },
    };

    return ZyraResult.success(result);
  } catch (error) {
    return ZyraResult.error(
      ErrorFactory.parsingFailed("Validation process failed", error.message)
    );
  }
}

/**
 * Get cache statistics and performance metrics
 * @returns {Object} Cache and performance statistics
 */
export function getCacheStats() {
  return globalCache.getStats();
}

/**
 * Clear all caches (useful for testing or memory management)
 */
export function clearCache() {
  globalCache.clear();
}

/**
 * Optimize cache performance
 */
export function optimizeCache() {
  globalCache.optimize();
}
