/**
 * Enhanced CSS rule generation logic
 * Converts parsed utility classes into comprehensive CSS rule objects
 */

import { escapeCSSSelector, normalizeCSSValue } from "../utils/cssUtils.js";

/**
 * CSS property type definitions for proper value handling
 */
const CSS_PROPERTY_TYPES = {
  LENGTH: new Set([
    "padding",
    "margin",
    "width",
    "height",
    "top",
    "left",
    "right",
    "bottom",
    "border-width",
    "border-radius",
    "font-size",
    "line-height",
    "letter-spacing",
    "gap",
    "grid-gap",
    "column-gap",
    "row-gap",
  ]),
  COLOR: new Set([
    "color",
    "background-color",
    "border-color",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "text-decoration-color",
  ]),
  NUMBER: new Set([
    "opacity",
    "z-index",
    "flex-grow",
    "flex-shrink",
    "order",
    "grid-column-start",
    "grid-column-end",
    "grid-row-start",
    "grid-row-end",
  ]),
  KEYWORD: new Set([
    "display",
    "position",
    "overflow",
    "text-align",
    "font-weight",
    "font-style",
    "text-decoration",
    "text-transform",
    "white-space",
    "vertical-align",
    "float",
    "clear",
  ]),
  COMPLEX: new Set([
    "transform",
    "box-shadow",
    "text-shadow",
    "background",
    "border",
    "transition",
    "animation",
    "filter",
    "backdrop-filter",
  ]),
};

/**
 * Enhanced CSS rule generation with comprehensive value processing
 * @param {Object} parsedClass - Parsed class object with property and value
 * @param {Object} options - Generation options
 * @returns {Object|null} Enhanced CSS rule object or null if invalid
 */
export function generateCSSRule(parsedClass, options = {}) {
  const {
    className,
    prefix,
    property,
    value,
    rawValue,
    selector,
    responsive,
    pseudoClass,
    important = false,
  } = parsedClass;

  // Validate required fields
  if (!property || !value || !selector) {
    return null;
  }

  try {
    // Process the CSS value based on property type
    const processedValue = processCSSValue(value, property, options);
    if (!processedValue) {
      return null;
    }

    // Generate CSS declarations
    const declarations = generateDeclarations(
      property,
      processedValue,
      important
    );

    // Create the complete CSS rule
    const rule = {
      selector: generateCompleteSelector(selector, responsive, pseudoClass),
      declarations,
      className,
      property,
      value: processedValue,
      rawValue,
      priority: calculateSpecificity(selector, responsive, pseudoClass),
      declarationString: formatDeclarations(declarations),
      metadata: {
        prefix,
        responsive,
        pseudoClass,
        important,
        type: getPropertyType(property),
      },
    };

    return rule;
  } catch (error) {
    // Log error for debugging but don't throw - graceful degradation
    console.warn(`CSS generation failed for ${className}: ${error.message}`);
    return null;
  }
}

/**
 * Process CSS value based on property type and context
 * @param {string} value - Raw CSS value
 * @param {string} property - CSS property name
 * @param {Object} options - Processing options
 * @returns {string|null} Processed CSS value or null if invalid
 */
function processCSSValue(value, property, options = {}) {
  const { strict = false } = options;

  // Normalize the value first
  const normalized = normalizeCSSValue(value);
  if (!normalized) {
    return null;
  }

  const propertyType = getPropertyType(property);

  switch (propertyType) {
    case "LENGTH":
      return processLengthValue(normalized, strict);

    case "COLOR":
      return processColorValue(normalized, strict);

    case "NUMBER":
      return processNumberValue(normalized, strict);

    case "KEYWORD":
      return processKeywordValue(normalized, property, strict);

    case "COMPLEX":
      return processComplexValue(normalized, property, strict);

    default:
      // For unknown properties, do basic validation
      return processFallbackValue(normalized, strict);
  }
}

/**
 * Process length values (px, em, rem, %, etc.)
 */
function processLengthValue(value, strict = false) {
  // Support for CSS calc() function
  if (value.startsWith("calc(")) {
    return validateCalcFunction(value, strict);
  }

  // Support for CSS custom properties
  if (value.startsWith("var(")) {
    return validateVarFunction(value, strict);
  }

  // Multiple values (shorthand properties)
  if (value.includes(" ")) {
    return processShorthandLength(value, strict);
  }

  // Single length value
  const lengthPattern =
    /^-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|em|rem|vh|vw|%|in|cm|mm|pt|pc|ex|ch|vmin|vmax|fr)$|^0$/;

  if (lengthPattern.test(value)) {
    return value;
  }

  // Allow keywords for length properties
  const lengthKeywords = [
    "auto",
    "inherit",
    "initial",
    "unset",
    "revert",
    "min-content",
    "max-content",
    "fit-content",
  ];
  if (lengthKeywords.includes(value)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Process color values (hex, rgb, hsl, named colors)
 */
function processColorValue(value, strict = false) {
  // CSS custom properties
  if (value.startsWith("var(")) {
    return validateVarFunction(value, strict);
  }

  // Hex colors
  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
    return value.toLowerCase();
  }

  // RGB/RGBA functions
  if (/^rgba?\([^)]+\)$/i.test(value)) {
    return validateRGBFunction(value, strict);
  }

  // HSL/HSLA functions
  if (/^hsla?\([^)]+\)$/i.test(value)) {
    return validateHSLFunction(value, strict);
  }

  // Named colors and keywords
  const colorKeywords = [
    "transparent",
    "currentcolor",
    "inherit",
    "initial",
    "unset",
    "revert",
    // Basic named colors
    "black",
    "white",
    "red",
    "green",
    "blue",
    "yellow",
    "orange",
    "purple",
    "pink",
    "brown",
    "gray",
    "grey",
    "cyan",
    "magenta",
    "lime",
    "maroon",
    "navy",
    "olive",
    "silver",
    "teal",
    "aqua",
    "fuchsia",
  ];

  if (colorKeywords.includes(value.toLowerCase())) {
    return value.toLowerCase();
  }

  return strict ? null : value;
}

/**
 * Process numeric values
 */
function processNumberValue(value, strict = false) {
  // CSS custom properties
  if (value.startsWith("var(")) {
    return validateVarFunction(value, strict);
  }

  // Pure numbers
  if (/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(value)) {
    return value;
  }

  // Keywords
  const numberKeywords = ["auto", "inherit", "initial", "unset", "revert"];
  if (numberKeywords.includes(value)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Process keyword values based on property
 */
function processKeywordValue(value, property, strict = false) {
  // CSS custom properties
  if (value.startsWith("var(")) {
    return validateVarFunction(value, strict);
  }

  // Property-specific keyword validation would go here
  // For now, allow any keyword-like value
  if (/^[a-zA-Z-]+$/.test(value)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Process complex values (transforms, shadows, etc.)
 */
function processComplexValue(value, property, strict = false) {
  // CSS custom properties
  if (value.startsWith("var(")) {
    return validateVarFunction(value, strict);
  }

  // For complex properties, we need more sophisticated parsing
  // For now, allow most reasonable values
  if (value.includes("(") && value.includes(")")) {
    return validateComplexFunction(value, property, strict);
  }

  return strict ? null : value;
}

/**
 * Fallback value processing for unknown properties
 */
function processFallbackValue(value, strict = false) {
  // Basic safety check - no dangerous patterns
  const dangerousPatterns = /javascript:|data:|expression\(/i;
  if (dangerousPatterns.test(value)) {
    return null;
  }

  return value;
}

/**
 * Validate calc() CSS function
 */
function validateCalcFunction(value, strict = false) {
  const calcPattern = /^calc\([^)]+\)$/;
  if (!calcPattern.test(value)) {
    return strict ? null : value;
  }

  // Basic validation - ensure balanced parentheses
  const innerCalc = value.slice(5, -1); // Remove 'calc(' and ')'
  if (hasBalancedParentheses(innerCalc)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Validate var() CSS custom property function
 */
function validateVarFunction(value, strict = false) {
  const varPattern = /^var\(--[a-zA-Z0-9-_]+(?:,\s*[^)]+)?\)$/;
  if (varPattern.test(value)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Validate RGB/RGBA function
 */
function validateRGBFunction(value, strict = false) {
  // Basic pattern check
  const rgbPattern =
    /^rgba?\(\s*(?:\d+(?:\.\d+)?(?:%)?|\d+(?:\.\d+)?(?:%)?)\s*,\s*(?:\d+(?:\.\d+)?(?:%)?|\d+(?:\.\d+)?(?:%)?)\s*,\s*(?:\d+(?:\.\d+)?(?:%)?|\d+(?:\.\d+)?(?:%)?)\s*(?:,\s*(?:\d+(?:\.\d+)?|\d+(?:\.\d+)?(?:%)?))?\s*\)$/;

  if (rgbPattern.test(value)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Validate HSL/HSLA function
 */
function validateHSLFunction(value, strict = false) {
  const hslPattern =
    /^hsla?\(\s*(?:\d+(?:\.\d+)?)\s*,\s*(?:\d+(?:\.\d+)?%)\s*,\s*(?:\d+(?:\.\d+)?%)\s*(?:,\s*(?:\d+(?:\.\d+)?|\d+(?:\.\d+)?(?:%)?))?\s*\)$/;

  if (hslPattern.test(value)) {
    return value;
  }

  return strict ? null : value;
}

/**
 * Validate complex CSS functions (transform, filter, etc.)
 */
function validateComplexFunction(value, property, strict = false) {
  // Allow most function-like values for complex properties
  // More specific validation would be property-dependent
  return value;
}

/**
 * Process shorthand length values (e.g., "10px 20px")
 */
function processShorthandLength(value, strict = false) {
  const parts = value.split(/\s+/);

  // Validate each part is a valid length
  for (const part of parts) {
    if (!processLengthValue(part, strict)) {
      return strict ? null : value;
    }
  }

  return value;
}

/**
 * Generate CSS declarations object
 */
function generateDeclarations(property, value, important = false) {
  const declarations = {};
  const finalValue = important ? `${value} !important` : value;

  // ZyraCSS uses native CSS logical properties - no Tailwind-style shortcuts
  // px maps to padding-inline, py maps to padding-block (native CSS)
  // This mapping is handled in the property maps, not here

  // Standard single property - let the property maps handle the CSS property name
  declarations[property] = finalValue;

  return declarations;
}

/**
 * Generate complete CSS selector with responsive and pseudo-class support
 */
function generateCompleteSelector(baseSelector, responsive, pseudoClass) {
  let selector = baseSelector;

  // Add pseudo-class
  if (pseudoClass) {
    selector += `:${pseudoClass}`;
  }

  // Wrap in media query for responsive
  if (responsive) {
    // This will be enhanced when we add proper breakpoint support
    selector = `@media (min-width: ${getBreakpointValue(responsive)}) { ${selector} }`;
  }

  return selector;
}

/**
 * Calculate CSS specificity for proper cascading
 */
function calculateSpecificity(selector, responsive, pseudoClass) {
  let specificity = 10; // Base class specificity

  if (pseudoClass) {
    specificity += 10; // Pseudo-class adds specificity
  }

  if (responsive) {
    specificity += 1; // Media queries have slight priority
  }

  return specificity;
}

/**
 * Get property type for value processing
 */
function getPropertyType(property) {
  for (const [type, properties] of Object.entries(CSS_PROPERTY_TYPES)) {
    if (properties.has(property)) {
      return type;
    }
  }
  return "UNKNOWN";
}

/**
 * Get breakpoint value for responsive design
 * TODO: This will be enhanced with proper breakpoint system
 */
function getBreakpointValue(breakpoint) {
  const breakpoints = {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  };

  return breakpoints[breakpoint] || "768px";
}

/**
 * Format CSS declarations object into string
 * @param {Object} declarations - CSS declarations object
 * @returns {string} Formatted declarations string
 */
export function formatDeclarations(declarations) {
  return Object.entries(declarations)
    .map(([prop, val]) => `${prop}: ${val}`)
    .sort() // Sort for consistent output
    .join("; ");
}

/**
 * Check if string has balanced parentheses
 */
function hasBalancedParentheses(str) {
  let count = 0;
  for (const char of str) {
    if (char === "(") count++;
    if (char === ")") count--;
    if (count < 0) return false;
  }
  return count === 0;
}
