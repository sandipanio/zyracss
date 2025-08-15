/**
 * Main programmatic API for ZyraCSS
 * One-shot CSS generation from utility classes
 */

import { parseClasses } from "../core/parser/index.js";
import { extractClassesFromHTMLArray } from "../core/parser/htmlExtractor.js";
import { generateCSS as generateCSSCore } from "../core/generator/index.js";
import { validateClasses } from "../core/validators/index.js";
import { sanitizeInputArray } from "../core/security/index.js";
import { now } from "../core/utils/index.js";

/**
 * Generate CSS from utility classes
 * @param {Object} input - Input configuration
 * @param {Array} [input.classes] - Array of utility class names
 * @param {Array} [input.html] - Array of HTML strings to scan for classes
 * @param {Object} [input.options] - Generation options
 * @returns {Promise<Object>} Generated CSS and metadata
 */
export async function generateCSS(input = {}) {
  const { classes = [], html = [], options = {} } = input;

  try {
    // Step 1: Collect all classes from various sources
    const allClasses = [...classes];

    // Extract classes from HTML if provided
    if (html.length > 0) {
      const extractedClasses = extractClassesFromHTMLArray(html);
      allClasses.push(...extractedClasses);
    }

    // Step 2: Sanitize and validate all classes
    const { sanitized, failed } = sanitizeInputArray(allClasses);
    const { valid: validClasses, invalid: invalidClasses } =
      validateClasses(sanitized);

    // Combine all invalid classes
    const allInvalid = [...invalidClasses, ...failed];

    if (validClasses.length === 0) {
      return {
        css: "",
        invalid: allInvalid,
        stats: {
          totalInput: allClasses.length,
          validClasses: 0,
          invalidClasses: allInvalid.length,
          generatedRules: 0,
          processingTime: 0,
        },
      };
    }

    // Step 3: Parse valid classes
    const startTime = now();
    const parsedClasses = parseClasses(validClasses);

    // Step 4: Generate CSS
    const result = generateCSSCore(parsedClasses, options);
    const processingTime = now() - startTime;

    // Step 5: Return comprehensive result
    return {
      css: result.css,
      invalid: allInvalid,
      stats: {
        totalInput: allClasses.length,
        validClasses: validClasses.length,
        invalidClasses: allInvalid.length,
        parsedClasses: parsedClasses.length,
        generatedRules: result.stats.totalRules,
        groupedRules: result.stats.groupedRules,
        compressionRatio: result.stats.compressionRatio,
        processingTime: Math.round(processingTime * 100) / 100, // Round to 2 decimal places
      },
    };
  } catch (error) {
    return {
      css: "",
      invalid: [error.message],
      stats: {
        totalInput: 0,
        validClasses: 0,
        invalidClasses: 0,
        generatedRules: 0,
        processingTime: 0,
        error: error.message,
      },
    };
  }
}

/**
 * Generate CSS from a single HTML string (convenience method)
 * @param {string} html - HTML string to scan
 * @param {Object} [options] - Generation options
 * @returns {Promise<Object>} Generated CSS and metadata
 */
export async function generateCSSFromHTML(html, options = {}) {
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
  return generateCSS({
    classes,
    options,
  });
}
