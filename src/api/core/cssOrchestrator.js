/**
 * CSS generation orchestrator module
 * Handles the core CSS generation workflow and caching
 */

import { parseClasses } from "../../core/parser/index.js";
import { generateCSS as generateCSSInternal } from "../../core/generator/index.js";
import { globalCache } from "../../core/cache/index.js";
import { ZyraResult, ErrorFactory } from "../../core/errors/essential.js";

/**
 * Generate CSS from validated and parsed classes
 * @param {Array} validClasses - Security-validated classes
 * @param {Object} options - Generation options
 * @param {Object} timer - Performance timer instance
 * @returns {Promise<ZyraResult>} CSS generation result
 */
export async function generateCSSFromValidatedClasses(
  validClasses,
  options,
  timer
) {
  // Early exit if no classes
  if (validClasses.length === 0) {
    return ZyraResult.success({
      css: "",
      rules: 0,
      stats: { message: "No classes provided", fromCache: false },
    });
  }

  // Check cache before expensive parsing and generation
  const cached = globalCache.getCachedGeneratedCSS(validClasses, options);
  if (cached) {
    return ZyraResult.success({
      css: cached.css,
      rules: cached.rules,
      stats: {
        ...cached.stats,
        fromCache: true,
        processingTime: timer.stop(),
      },
    });
  }

  // Parse classes with error collection (expensive operation)
  const parseResult = parseClasses(validClasses);
  if (!parseResult.hasAnyValid) {
    return ZyraResult.error(
      ErrorFactory.parsingFailed(
        "All classes failed to parse",
        "No valid utility classes found"
      )
    );
  }

  // Generate CSS without double-caching
  const generationResult = await generateCSSWithoutCaching(
    parseResult.parsed,
    validClasses,
    options,
    timer
  );

  if (!generationResult.success) {
    return generationResult;
  }

  // Return result with parse errors
  return ZyraResult.success({
    ...generationResult.data,
    parseErrors: parseResult.invalid,
  });
}

/**
 * Generate CSS without caching - called after cache miss
 * @param {Array} parsedClasses - Parsed class objects
 * @param {Array} classNames - Original class name strings for caching
 * @param {Object} options - Generation options
 * @param {Object} timer - Performance timer instance
 * @returns {Promise<ZyraResult>} CSS generation result
 */
async function generateCSSWithoutCaching(
  parsedClasses,
  classNames,
  options,
  timer
) {
  try {
    // Generate CSS (expensive operation)
    const result = generateCSSInternal(parsedClasses, options);

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
      rules: result.rules || [],
      stats: {
        ...result.stats,
        fromCache: false,
        processingTime: timer.stop(),
      },
    });
  } catch (error) {
    return ZyraResult.error(
      ErrorFactory.generationFailed("CSS generation process", error.message)
    );
  }
}

/**
 * Compile final CSS generation result with all statistics and errors
 * @param {Object} generationData - CSS generation data
 * @param {Array} parseErrors - Parse errors
 * @param {Array} securityIssues - Security issues
 * @param {Object} extractionStats - Extraction statistics
 * @param {number} processingTime - Processing time in milliseconds
 * @returns {Object} Final compiled result
 */
export function compileFinalResult(
  generationData,
  parseErrors = [],
  securityIssues = [],
  extractionStats = {},
  processingTime = 0
) {
  return {
    css: generationData.css,
    stats: {
      totalInput: extractionStats.totalClasses || 0,
      validClasses: generationData.stats?.totalClasses || 0,
      invalidClasses: parseErrors.length + securityIssues.length,
      generatedRules: generationData.stats?.totalRules || 0,
      processingTime: processingTime,
      fromCache: generationData.stats?.fromCache || false,
      cacheTimestamp: generationData.stats?.cacheTimestamp || null,
    },
    invalid: parseErrors,
    security: securityIssues,
  };
}

/**
 * Check if generation result has any valid output
 * @param {Object} result - Generation result
 * @returns {boolean} True if result has valid CSS output
 */
export function hasValidOutput(result) {
  return result && result.css && result.css.length > 0;
}

/**
 * Create empty generation result
 * @param {string} reason - Reason for empty result
 * @returns {Object} Empty result object
 */
export function createEmptyResult(reason = "No valid classes") {
  return {
    css: "",
    rules: 0,
    stats: { message: reason, fromCache: false },
  };
}
