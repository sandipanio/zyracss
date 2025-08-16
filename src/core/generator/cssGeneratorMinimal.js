/**
 * Minimal CSS Generator that avoids heavy initialization
 * This bypasses the hanging issue while providing core functionality
 */

import { normalizeCSSValue } from "../utils/cssUtils.js";

/**
 * Generate CSS rule from parsed class data
 * @param {Object} parsedClass - Parsed class object
 * @param {Object} options - Generation options
 * @returns {Object} Generated CSS rule
 */
export function generateCSSRule(parsedClass, options = {}) {
  const {
    className,
    property,
    value,
    values,
    selector,
    responsive,
    pseudoClass,
  } = parsedClass;

  if (!property || !value) {
    return {
      success: false,
      error: "Missing property or value",
    };
  }

  try {
    // Normalize the CSS value
    const normalizedValue = normalizeCSSValue(value);

    // Generate the complete selector
    let completeSelector = selector || `.${className}`;
    if (responsive) {
      completeSelector = `@media ${responsive} { ${completeSelector} }`;
    }
    if (pseudoClass) {
      completeSelector = completeSelector.replace("}", `${pseudoClass} }`);
    }

    // Create the CSS rule
    const cssRule = `${completeSelector} { ${property}: ${normalizedValue}; }`;

    return {
      success: true,
      css: cssRule,
      selector: completeSelector,
      property,
      value: normalizedValue,
      className,
      specificity: calculateBasicSpecificity(selector, responsive, pseudoClass),
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Generate CSS from multiple parsed classes
 * @param {Array} parsedClasses - Array of parsed class objects
 * @param {Object} options - Generation options
 * @returns {string} Generated CSS
 */
export function generateCSSFromClasses(parsedClasses, options = {}) {
  if (!Array.isArray(parsedClasses)) {
    return "";
  }

  const rules = [];

  for (const parsedClass of parsedClasses) {
    if (parsedClass && parsedClass.success) {
      const rule = generateCSSRule(parsedClass.data || parsedClass, options);
      if (rule && rule.success) {
        rules.push(rule.css);
      }
    }
  }

  return rules.join("\\n");
}

/**
 * Basic specificity calculation
 * @param {string} selector - CSS selector
 * @param {string} responsive - Media query
 * @param {string} pseudoClass - Pseudo class
 * @returns {number} Basic specificity score
 */
function calculateBasicSpecificity(selector, responsive, pseudoClass) {
  let specificity = 10; // Base specificity

  if (selector && selector.includes(".")) {
    specificity += 10; // Class selector
  }

  if (pseudoClass) {
    specificity += 10; // Pseudo class
  }

  if (responsive) {
    specificity += 5; // Media query
  }

  return specificity;
}
