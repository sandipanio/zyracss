/**
 * Convenience methods for common API use cases
 * Simplified interfaces for specific scenarios
 */

import { generateCSS } from "./generateCSS.js";
import { now } from "../core/utils/index.js";

/**
 * Generate CSS from a single HTML string (convenience method)
 * @param {string} html - HTML string to scan
 * @param {Object} [options] - Generation options
 * @returns {Promise<Object>} Generated CSS and metadata
 */
export async function generateCSSFromHTML(html, options = {}) {
  if (typeof html !== "string") {
    return {
      success: false,
      css: "",
      invalid: ["HTML input must be a string"],
      stats: {
        totalInput: 0,
        validClasses: 0,
        invalidClasses: 1,
        generatedRules: 0,
        processingTime: 0,
      },
    };
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
 * @returns {Promise<Object>} Generated CSS and metadata
 */
export async function generateCSSFromClasses(classes, options = {}) {
  if (!Array.isArray(classes)) {
    return {
      success: false,
      css: "",
      invalid: ["Classes input must be an array"],
      stats: {
        totalInput: 0,
        validClasses: 0,
        invalidClasses: 1,
        generatedRules: 0,
        processingTime: 0,
      },
    };
  }

  return generateCSS({
    classes,
    options,
  });
}

/**
 * Generate minified CSS for production
 * @param {Object} input - Input configuration (same as generateCSS)
 * @returns {Promise<Object>} Generated minified CSS
 */
export async function generateMinifiedCSS(input) {
  const options = {
    ...input.options,
    minify: true,
    includeComments: false,
  };

  return generateCSS({
    ...input,
    options,
  });
}

/**
 * Generate CSS with detailed debugging information
 * @param {Object} input - Input configuration
 * @returns {Promise<Object>} Generated CSS with debug info
 */
export async function generateCSSWithDebug(input) {
  const options = {
    ...input.options,
    includeComments: true,
    minify: false,
  };

  const result = await generateCSS({
    ...input,
    options,
  });

  // Add debug information
  if (result.success) {
    result.debug = {
      inputAnalysis: {
        htmlSources: input.html ? input.html.length : 0,
        directClasses: input.classes ? input.classes.length : 0,
        totalInput: result.stats.totalInput,
      },
      processingSteps: [
        "Input validation",
        "HTML class extraction",
        "Class deduplication",
        "Security validation",
        "CSS parsing",
        "CSS generation",
        "Rule grouping",
        "Output formatting",
      ],
      performance: {
        processingTime: result.stats.processingTime,
        classesPerMs:
          result.stats.validClasses / (result.stats.processingTime || 1),
        compressionRatio: result.stats.compressionRatio,
      },
    };
  }

  return result;
}

/**
 * Validate classes without generating CSS
 * @param {Array<string>} classes - Array of class names to validate
 * @returns {Promise<Object>} Validation results only
 */
export async function validateClassNames(classes) {
  if (!Array.isArray(classes)) {
    return {
      success: false,
      valid: [],
      invalid: ["Input must be an array"],
      stats: {
        total: 0,
        validCount: 0,
        invalidCount: 1,
      },
    };
  }

  // Import validation functions
  const { validateClasses } = await import("../core/validators/index.js");
  const { sanitizeInputArray } = await import("../core/security/index.js");

  try {
    const startTime = now();

    // Sanitize input
    const { sanitized, failed } = sanitizeInputArray(classes);

    // Validate classes
    const validationResult = validateClasses(sanitized);

    const processingTime = now() - startTime;

    return {
      success: true,
      valid: validationResult.valid,
      invalid: [...validationResult.invalid, ...failed],
      stats: {
        total: classes.length,
        validCount: validationResult.valid.length,
        invalidCount: validationResult.invalid.length + failed.length,
        processingTime: Math.round(processingTime * 100) / 100,
      },
    };
  } catch (error) {
    return {
      success: false,
      valid: [],
      invalid: [error.message],
      stats: {
        total: classes.length,
        validCount: 0,
        invalidCount: 1,
        error: error.message,
      },
    };
  }
}

/**
 * Quick CSS generation for small sets of classes
 * @param {Array<string>} classes - Small array of classes (recommended < 100)
 * @param {boolean} [minify=true] - Whether to minify output
 * @returns {Promise<string>} CSS string only (no metadata)
 */
export async function quickCSS(classes, minify = true) {
  const result = await generateCSSFromClasses(classes, { minify });
  return result.css || "";
}

/**
 * Generate CSS and return only the raw CSS string
 * @param {Object} input - Input configuration
 * @returns {Promise<string>} CSS string only
 */
export async function getCSSString(input) {
  const result = await generateCSS(input);
  return result.css || "";
}

/**
 * Check if classes are valid ZyraCSS classes
 * @param {Array<string>} classes - Classes to check
 * @returns {Promise<boolean>} True if all classes are valid
 */
export async function areValidClasses(classes) {
  const result = await validateClassNames(classes);
  return result.success && result.invalid.length === 0;
}

/**
 * Get CSS size estimate without full generation
 * @param {Array<string>} classes - Classes to estimate
 * @returns {Promise<Object>} Size estimation
 */
export async function estimateCSSSize(classes) {
  if (!Array.isArray(classes)) {
    return {
      estimatedSize: 0,
      estimatedRules: 0,
      confidence: 0,
    };
  }

  // Simple estimation based on class patterns
  const validationResult = await validateClassNames(classes);
  const validClasses = validationResult.valid;

  // Rough estimates based on typical rule sizes
  const avgBytesPerRule = 45; // Rough average
  const avgRulesPerClass = 1; // Most classes generate 1 rule

  const estimatedRules = validClasses.length * avgRulesPerClass;
  const estimatedSize = estimatedRules * avgBytesPerRule;

  return {
    estimatedSize,
    estimatedRules,
    confidence: validClasses.length > 0 ? 0.7 : 0, // 70% confidence for rough estimate
    unit: "bytes",
  };
}

/**
 * Generate CSS with streaming-like interface for large inputs
 * @param {Object} input - Input configuration
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Generated CSS with progress tracking
 */
export async function generateCSSWithProgress(input, onProgress) {
  const { classes = [], html = [] } = input;

  // Report initial progress
  if (typeof onProgress === "function") {
    onProgress({ stage: "starting", progress: 0 });
  }

  // Process in chunks for large inputs
  const totalClasses = classes.length;
  const chunkSize = 1000;

  if (totalClasses > chunkSize) {
    let allCSS = "";
    let processedCount = 0;
    const startTime = now();

    for (let i = 0; i < totalClasses; i += chunkSize) {
      const chunk = classes.slice(i, i + chunkSize);

      if (typeof onProgress === "function") {
        onProgress({
          stage: "processing",
          progress: (processedCount / totalClasses) * 100,
          processed: processedCount,
          total: totalClasses,
        });
      }

      const result = await generateCSSFromClasses(chunk, input.options);
      if (result.success) {
        allCSS += result.css + "\n";
      }

      processedCount += chunk.length;
    }

    if (typeof onProgress === "function") {
      onProgress({ stage: "complete", progress: 100 });
    }

    const totalTime = now() - startTime;

    return {
      success: true,
      css: allCSS.trim(),
      stats: {
        totalInput: totalClasses,
        validClasses: processedCount,
        processingTime: Math.round(totalTime * 100) / 100,
      },
    };
  } else {
    // Use regular processing for smaller inputs
    return generateCSS(input);
  }
}
