/**
 * Class array processing for the API layer
 * Handles class array input processing and validation
 */

import { validateClasses } from "../../core/validators/index.js";
import { sanitizeInputArray } from "../../core/security/index.js";
import { createLogger, now } from "../../core/utils/essential.js";
import { ZyraResult, ErrorFactory } from "../../core/errors/essential.js";

const logger = createLogger("ClassProcessor");

/**
 * Process class array input
 * @param {Array<string>} classArray - Array of class names
 * @param {Object} options - Processing options
 * @returns {Object} Processing result with validated classes
 */
export function processClassInput(classArray, options = {}) {
  const {
    sanitizeInput = true,
    strictValidation = false,
    includeStats = false,
    deduplicate = true,
  } = options;

  const startTime = now();

  // Validate input type
  if (!Array.isArray(classArray)) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(classArray, "Class input must be an array", [
        "Provide an array of class strings",
        "Example: ['m-4', 'p-2', 'bg-blue-500']",
      ])
    );
  }

  // Filter out non-string values
  const stringClasses = classArray.filter(
    (cls) => typeof cls === "string" && cls.trim()
  );

  if (stringClasses.length === 0) {
    return ZyraResult.success({
      classes: [],
      invalid: [],
      stats: includeStats
        ? {
            inputCount: classArray.length,
            stringClasses: 0,
            validClasses: 0,
            invalidClasses: 0,
            processingTime: now() - startTime,
          }
        : undefined,
    });
  }

  try {
    let processedClasses = stringClasses;
    const securityIssues = [];

    // Sanitize classes if requested
    if (sanitizeInput) {
      const sanitizeResult = sanitizeInputArray(stringClasses);
      processedClasses = sanitizeResult.sanitized;

      if (sanitizeResult.failed.length > 0) {
        securityIssues.push(...sanitizeResult.failed);
        logger.warn(
          `${sanitizeResult.failed.length} classes failed sanitization`
        );
      }
    }

    // Deduplicate classes if requested
    if (deduplicate) {
      processedClasses = [...new Set(processedClasses)];
    }

    // Validate classes
    const validationResult = validateClasses(processedClasses);

    const processingTime = now() - startTime;

    return ZyraResult.success({
      classes: validationResult.valid,
      invalid: [...validationResult.invalid, ...securityIssues],
      stats: includeStats
        ? {
            inputCount: classArray.length,
            stringClasses: stringClasses.length,
            processedClasses: processedClasses.length,
            validClasses: validationResult.valid.length,
            invalidClasses:
              validationResult.invalid.length + securityIssues.length,
            deduplicationSaved: stringClasses.length - processedClasses.length,
            processingTime: Math.round(processingTime * 100) / 100,
          }
        : undefined,
    });
  } catch (error) {
    logger.error("Class processing failed:", error.message);

    return ZyraResult.error(
      ErrorFactory.parsingFailed("Class processing failed", error.message, [
        "Check class name syntax",
        "Remove invalid characters",
        "Ensure valid utility class format",
      ])
    );
  }
}

/**
 * Analyze class array for patterns and issues
 * @param {Array<string>} classArray - Array of class names
 * @returns {Object} Analysis results
 */
export function analyzeClassArray(classArray) {
  if (!Array.isArray(classArray)) {
    return {
      totalClasses: 0,
      uniqueClasses: 0,
      duplicates: 0,
      patterns: {},
      issues: ["Input is not an array"],
    };
  }

  const issues = [];
  const patterns = {
    bracket: 0, // p-[24px]
    shorthand: 0, // p-24px
    simple: 0, // text-center
    unknown: 0, // unrecognized patterns
  };

  // Filter string classes
  const stringClasses = classArray.filter((cls) => {
    if (typeof cls !== "string") {
      issues.push(`Non-string class found: ${typeof cls}`);
      return false;
    }
    return true;
  });

  const uniqueClasses = new Set(stringClasses);
  const duplicates = stringClasses.length - uniqueClasses.size;

  // Analyze patterns
  for (const className of uniqueClasses) {
    if (!className.trim()) {
      issues.push("Empty class name found");
      continue;
    }

    if (className.includes("[") && className.includes("]")) {
      patterns.bracket++;
    } else if (className.includes("-") && /\d/.test(className)) {
      patterns.shorthand++;
    } else if (/^[a-zA-Z-]+$/.test(className)) {
      patterns.simple++;
    } else {
      patterns.unknown++;
      issues.push(`Unknown pattern: ${className}`);
    }
  }

  // Check for common issues
  if (duplicates > stringClasses.length * 0.3) {
    issues.push(
      `High number of duplicates: ${duplicates}/${stringClasses.length}`
    );
  }

  if (patterns.unknown > uniqueClasses.size * 0.1) {
    issues.push(
      `Many unrecognized patterns: ${patterns.unknown}/${uniqueClasses.size}`
    );
  }

  return {
    totalClasses: classArray.length,
    stringClasses: stringClasses.length,
    uniqueClasses: uniqueClasses.size,
    duplicates,
    duplicationRate:
      stringClasses.length > 0
        ? ((duplicates / stringClasses.length) * 100).toFixed(1) + "%"
        : "0%",
    patterns,
    issues,
    quality: calculateQualityScore(
      stringClasses,
      uniqueClasses.size,
      duplicates,
      issues.length
    ),
  };
}

/**
 * Calculate quality score for class array
 * @param {Array} classes - Array of classes
 * @param {number} unique - Number of unique classes
 * @param {number} duplicates - Number of duplicates
 * @param {number} issues - Number of issues
 * @returns {string} Quality score
 */
function calculateQualityScore(classes, unique, duplicates, issues) {
  if (classes.length === 0) return "N/A";

  let score = 100;

  // Penalize duplicates
  score -= (duplicates / classes.length) * 30;

  // Penalize issues
  score -= issues * 10;

  // Penalize very short or very long class names
  const avgLength =
    classes.reduce((sum, cls) => sum + cls.length, 0) / classes.length;
  if (avgLength < 3 || avgLength > 50) {
    score -= 10;
  }

  score = Math.max(0, Math.min(100, score));

  if (score >= 90) return "excellent";
  if (score >= 75) return "good";
  if (score >= 60) return "average";
  if (score >= 40) return "poor";
  return "very-poor";
}

/**
 * Suggest optimizations for class array
 * @param {Object} analysis - Analysis result from analyzeClassArray
 * @returns {Array<Object>} Array of optimization suggestions
 */
export function suggestOptimizations(analysis) {
  const suggestions = [];

  if (analysis.duplicates > 0) {
    suggestions.push({
      type: "deduplication",
      priority: "high",
      description: `Remove ${analysis.duplicates} duplicate class names`,
      impact: `Reduce input size by ${analysis.duplicationRate}`,
      action: "Enable deduplication option",
    });
  }

  if (analysis.patterns.unknown > 0) {
    suggestions.push({
      type: "validation",
      priority: "medium",
      description: `${analysis.patterns.unknown} classes have unrecognized patterns`,
      impact: "May cause CSS generation failures",
      action: "Review and fix invalid class names",
    });
  }

  if (analysis.totalClasses > 5000) {
    suggestions.push({
      type: "performance",
      priority: "medium",
      description: `Large number of classes (${analysis.totalClasses})`,
      impact: "May impact processing performance",
      action: "Consider batch processing or pagination",
    });
  }

  if (analysis.quality === "poor" || analysis.quality === "very-poor") {
    suggestions.push({
      type: "quality",
      priority: "high",
      description: `Class quality is ${analysis.quality}`,
      impact: "May cause unexpected behavior",
      action: "Review input data and fix issues",
    });
  }

  return suggestions;
}
