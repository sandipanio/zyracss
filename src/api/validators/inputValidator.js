/**
 * Input validation module for generateCSS API
 * Handles validation of input parameters and structure
 */

import { ZyraResult, ErrorFactory } from "../../core/errors/essential.js";

/**
 * Validate the main generateCSS input
 * @param {string|string[]|Object} input - Input to validate (classes, HTML, or structured object)
 * @param {Object} options - Generation options
 * @returns {ZyraResult} Validation result
 */
export function validateGenerateInput(input, options = {}) {
  // Handle direct array/string inputs (common usage)
  if (Array.isArray(input)) {
    // Direct classes array
    const classValidation = validateClassesInput(input);
    if (!classValidation.success) return classValidation;

    return ZyraResult.success({
      input,
      options: validateOptions(options),
    });
  }

  if (typeof input === "string") {
    // Direct HTML string
    const htmlValidation = validateHTMLInput([input]);
    if (!htmlValidation.success) return htmlValidation;

    return ZyraResult.success({
      input: [input],
      options: validateOptions(options),
    });
  }

  // Handle structured input object (advanced usage)
  if (!input || typeof input !== "object") {
    return ZyraResult.error(
      ErrorFactory.invalidInput(
        input,
        "Input must be an array, string, or object"
      )
    );
  }

  const { classes, html, options: inputOptions } = input;
  const mergedOptions = { ...options, ...inputOptions };

  // Validate that at least one input source is provided
  if (!classes && !html) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(
        input,
        "Either classes or html must be provided",
        [
          "Provide a classes array: ['m-4', 'p-2']",
          "Provide HTML strings: ['<div class=\"m-4\">...']",
        ]
      )
    );
  }

  // Quick type validation - detailed processing happens in main function
  if (classes !== undefined) {
    const classValidation = validateClassesInput(classes);
    if (!classValidation.success) return classValidation;
  }

  if (html !== undefined) {
    const htmlValidation = validateHTMLInput(html);
    if (!htmlValidation.success) return htmlValidation;
  }

  return ZyraResult.success({
    input: { classes, html },
    options: validateOptions(mergedOptions),
  });
}

/**
 * Validate options object
 * @param {Object} options - Options to validate
 * @returns {Object} Validated options
 */
function validateOptions(options = {}) {
  if (typeof options !== "object" || options === null) {
    return {};
  }
  return options;
}

/**
 * Validate classes array input
 * @param {Array} classes - Classes to validate
 * @returns {ZyraResult} Validation result
 */
export function validateClassesInput(classes) {
  if (!Array.isArray(classes)) {
    return ZyraResult.error(
      ErrorFactory.invalidInput(classes, "Classes must be an array")
    );
  }

  return ZyraResult.success(classes);
}

/**
 * Validate HTML string input
 * @param {string} html - HTML string to validate
 * @returns {ZyraResult} Validation result
 */
export function validateHTMLInput(html) {
  if (typeof html !== "string") {
    return ZyraResult.error(
      ErrorFactory.invalidInput(html, "HTML must be a string")
    );
  }

  return ZyraResult.success(html);
}
