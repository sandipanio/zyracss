/**
 * HTML-specific processing for the API layer
 * Handles HTML input processing and class extraction
 */

import { extractClassesFromHTMLArray } from "../core/parser/htmlExtractor.js";
import { sanitizeInputArray } from "../core/security/index.js";
import { createLogger, now } from "../core/utils/index.js";

const logger = createLogger("HTMLProcessor");

/**
 * Process HTML input and extract classes
 * @param {Array<string>} htmlArray - Array of HTML strings
 * @param {Object} options - Processing options
 * @returns {Object} Processing result with extracted classes
 */
export function processHTMLInput(htmlArray, options = {}) {
  const {
    validateHTML = true,
    sanitizeInput = true,
    includeStats = false,
  } = options;

  const startTime = now();

  // Validate input type
  if (!Array.isArray(htmlArray)) {
    return {
      success: false,
      classes: [],
      error: "HTML input must be an array",
      stats: includeStats ? { processingTime: 0 } : undefined,
    };
  }

  // Filter and validate HTML strings
  const validHTML = htmlArray.filter(
    (html) => typeof html === "string" && html.trim()
  );

  if (validHTML.length === 0) {
    return {
      success: true,
      classes: [],
      stats: includeStats
        ? {
            inputCount: htmlArray.length,
            validHTML: 0,
            extractedClasses: 0,
            processingTime: now() - startTime,
          }
        : undefined,
    };
  }

  try {
    let processedHTML = validHTML;

    // Sanitize HTML if requested
    if (sanitizeInput) {
      const sanitizeResult = sanitizeInputArray(validHTML);
      processedHTML = sanitizeResult.sanitized;

      if (sanitizeResult.failed.length > 0) {
        logger.warn(
          `${sanitizeResult.failed.length} HTML strings failed sanitization`
        );
      }
    }

    // Extract classes from HTML
    const extractedClasses = extractClassesFromHTMLArray(processedHTML);

    const processingTime = now() - startTime;

    return {
      success: true,
      classes: extractedClasses,
      stats: includeStats
        ? {
            inputCount: htmlArray.length,
            validHTML: validHTML.length,
            processedHTML: processedHTML.length,
            extractedClasses: extractedClasses.length,
            uniqueClasses: new Set(extractedClasses).size,
            processingTime: Math.round(processingTime * 100) / 100,
          }
        : undefined,
    };
  } catch (error) {
    logger.error("HTML processing failed:", error.message);

    return {
      success: false,
      classes: [],
      error: `HTML processing failed: ${error.message}`,
      stats: includeStats
        ? {
            processingTime: now() - startTime,
            error: error.message,
          }
        : undefined,
    };
  }
}

/**
 * Validate HTML content for common issues
 * @param {string} html - HTML string to validate
 * @returns {Object} Validation result
 */
export function validateHTMLContent(html) {
  if (typeof html !== "string") {
    return {
      isValid: false,
      issues: ["Input must be a string"],
    };
  }

  const issues = [];

  // Check for basic HTML structure issues
  if (html.trim().length === 0) {
    issues.push("HTML content is empty");
  }

  // Check for unmatched brackets in class attributes
  const classMatches = html.match(/class(Name)?=["'][^"']*["']/g) || [];
  for (const match of classMatches) {
    const classValue = match.match(/=["']([^"']*)["']/)?.[1];
    if (classValue && (classValue.includes("[") || classValue.includes("]"))) {
      // Check for unmatched brackets
      const openBrackets = (classValue.match(/\[/g) || []).length;
      const closeBrackets = (classValue.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push(`Unmatched brackets in class attribute: ${match}`);
      }
    }
  }

  // Check for suspicious patterns
  if (html.includes("<script")) {
    issues.push("HTML contains script tags (potential security risk)");
  }

  if (html.includes("javascript:")) {
    issues.push("HTML contains javascript: URLs (potential security risk)");
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Extract and analyze class usage patterns from HTML
 * @param {Array<string>} htmlArray - Array of HTML strings
 * @returns {Object} Analysis results
 */
export function analyzeClassUsage(htmlArray) {
  if (!Array.isArray(htmlArray)) {
    return {
      totalElements: 0,
      elementsWithClasses: 0,
      classFrequency: {},
      averageClassesPerElement: 0,
    };
  }

  const classFrequency = {};
  let totalElements = 0;
  let elementsWithClasses = 0;
  let totalClasses = 0;

  for (const html of htmlArray) {
    if (typeof html !== "string") continue;

    // Count elements with class attributes
    const elementMatches =
      html.match(/<[^>]+class(Name)?=["'][^"']*["'][^>]*>/g) || [];
    elementsWithClasses += elementMatches.length;

    // Count total elements
    const allElements = html.match(/<[^>\/][^>]*>/g) || [];
    totalElements += allElements.length;

    // Analyze class frequency
    for (const element of elementMatches) {
      const classMatch = element.match(/class(Name)?=["']([^"']*)["']/);
      if (classMatch && classMatch[2]) {
        const classes = classMatch[2].split(/\s+/).filter(Boolean);
        totalClasses += classes.length;

        for (const className of classes) {
          classFrequency[className] = (classFrequency[className] || 0) + 1;
        }
      }
    }
  }

  // Sort classes by frequency
  const sortedClasses = Object.entries(classFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 20); // Top 20 most used classes

  return {
    totalElements,
    elementsWithClasses,
    classFrequency,
    topClasses: sortedClasses,
    averageClassesPerElement:
      elementsWithClasses > 0
        ? (totalClasses / elementsWithClasses).toFixed(2)
        : 0,
    classUtilization:
      totalElements > 0
        ? ((elementsWithClasses / totalElements) * 100).toFixed(1) + "%"
        : "0%",
  };
}

/**
 * Clean and normalize HTML before processing
 * @param {string} html - HTML string to clean
 * @returns {string} Cleaned HTML
 */
export function cleanHTML(html) {
  if (typeof html !== "string") {
    return "";
  }

  let cleaned = html;

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, "");

  // Normalize whitespace in class attributes
  cleaned = cleaned.replace(
    /class(Name)?=["']([^"']*)["']/g,
    (match, suffix, classes) => {
      const normalizedClasses = classes.split(/\s+/).filter(Boolean).join(" ");
      return `class${suffix || ""}="${normalizedClasses}"`;
    }
  );

  // Remove extra whitespace
  cleaned = cleaned.replace(/\s+/g, " ").trim();

  return cleaned;
}
