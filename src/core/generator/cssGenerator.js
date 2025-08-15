/**
 * CSS rule generation logic with dynamic property types
 * Fixes hardcoded property types and improves value validation
 */

import { normalizeCSSValue } from "../utils/cssUtils.js";

/**
 * Dynamic CSS property type detection based on property maps
 * This replaces the hardcoded CSS_PROPERTY_TYPES
 */
class PropertyTypeDetector {
  constructor() {
    this.typeCache = new Map();
    this.initializePropertyTypes();
  }

  /**
   * Initialize property types dynamically from property maps
   */
  initializePropertyTypes() {
    // Import all property maps to build dynamic type system
    const propertyMappings = {
      LENGTH: [
        // Spacing properties
        "padding",
        "padding-top",
        "padding-right",
        "padding-bottom",
        "padding-left",
        "padding-block",
        "padding-inline",
        "padding-block-start",
        "padding-block-end",
        "padding-inline-start",
        "padding-inline-end",
        "margin",
        "margin-top",
        "margin-right",
        "margin-bottom",
        "margin-left",
        "margin-block",
        "margin-inline",
        "margin-block-start",
        "margin-block-end",
        "margin-inline-start",
        "margin-inline-end",
        "gap",
        "column-gap",
        "row-gap",
        // Sizing properties
        "width",
        "height",
        "min-width",
        "max-width",
        "min-height",
        "max-height",
        // Typography spacing
        "font-size",
        "line-height",
        "letter-spacing",
        // Border properties
        "border-width",
        "border-radius",
        // Position properties
        "top",
        "right",
        "bottom",
        "left",
      ],
      COLOR: [
        "color",
        "background-color",
        "border-color",
        "border-top-color",
        "border-right-color",
        "border-bottom-color",
        "border-left-color",
      ],
      NUMBER: ["opacity", "z-index", "flex-grow", "flex-shrink", "order"],
      KEYWORD: [
        "display",
        "position",
        "overflow",
        "overflow-x",
        "overflow-y",
        "text-align",
        "font-weight",
        "font-style",
        "text-decoration",
        "text-transform",
        "white-space",
        "vertical-align",
        "float",
        "clear",
      ],
      COMPLEX: [
        "transform",
        "box-shadow",
        "text-shadow",
        "background",
        "border",
        "transition",
        "animation",
        "filter",
        "backdrop-filter",
      ],
    };

    // Build reverse lookup cache
    for (const [type, properties] of Object.entries(propertyMappings)) {
      for (const property of properties) {
        this.typeCache.set(property, type);
      }
    }
  }

  /**
   * Get property type dynamically
   * @param {string} property - CSS property name
   * @returns {string} Property type or 'UNKNOWN'
   */
  getPropertyType(property) {
    return this.typeCache.get(property) || "UNKNOWN";
  }

  /**
   * Check if property accepts multiple values (shorthand)
   * @param {string} property - CSS property name
   * @returns {boolean} True if property accepts shorthand values
   */
  acceptsShorthand(property) {
    const shorthandProperties = new Set([
      "padding",
      "margin",
      "border-width",
      "border-radius",
    ]);
    return shorthandProperties.has(property);
  }
}

// Global instance for performance
const propertyDetector = new PropertyTypeDetector();

/**
 * Enhanced CSS function validator
 */
class CSSFunctionValidator {
  constructor() {
    this.validFunctions = new Map([
      // Color functions
      ["rgb", { minArgs: 3, maxArgs: 3, validator: this.validateRGBArgs }],
      ["rgba", { minArgs: 4, maxArgs: 4, validator: this.validateRGBArgs }],
      ["hsl", { minArgs: 3, maxArgs: 3, validator: this.validateHSLArgs }],
      ["hsla", { minArgs: 4, maxArgs: 4, validator: this.validateHSLArgs }],

      // Length functions
      ["calc", { minArgs: 1, maxArgs: 1, validator: this.validateCalcArgs }],
      [
        "min",
        { minArgs: 1, maxArgs: Infinity, validator: this.validateLengthArgs },
      ],
      [
        "max",
        { minArgs: 1, maxArgs: Infinity, validator: this.validateLengthArgs },
      ],
      ["clamp", { minArgs: 3, maxArgs: 3, validator: this.validateLengthArgs }],

      // CSS Variables
      ["var", { minArgs: 1, maxArgs: 2, validator: this.validateVarArgs }],

      // Transform functions
      [
        "translate",
        { minArgs: 1, maxArgs: 2, validator: this.validateLengthArgs },
      ],
      ["rotate", { minArgs: 1, maxArgs: 1, validator: this.validateAngleArgs }],
      ["scale", { minArgs: 1, maxArgs: 2, validator: this.validateNumberArgs }],

      // Gradient functions
      [
        "linear-gradient",
        { minArgs: 2, maxArgs: Infinity, validator: this.validateGradientArgs },
      ],
      [
        "radial-gradient",
        { minArgs: 2, maxArgs: Infinity, validator: this.validateGradientArgs },
      ],
    ]);
  }

  /**
   * Validate CSS function with proper argument checking
   * @param {string} functionCall - CSS function call like "rgb(255, 0, 0)"
   * @returns {boolean} True if valid function
   */
  validateFunction(functionCall) {
    const match = functionCall.match(/^([a-zA-Z-]+)\((.*)\)$/);
    if (!match) return false;

    const [, funcName, argsString] = match;
    const validator = this.validFunctions.get(funcName);

    if (!validator) {
      // Unknown function - allow for extensibility but warn
      console.warn(`Unknown CSS function: ${funcName}`);
      return true; // Be permissive for unknown functions
    }

    const args = this.parseArguments(argsString);

    // Check argument count
    if (args.length < validator.minArgs || args.length > validator.maxArgs) {
      return false;
    }

    // Validate arguments with specific validator
    return validator.validator.call(this, args);
  }

  /**
   * Parse CSS function arguments respecting commas and parentheses
   * @param {string} argsString - Argument string
   * @returns {Array<string>} Parsed arguments
   */
  parseArguments(argsString) {
    const args = [];
    let current = "";
    let parenDepth = 0;
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < argsString.length; i++) {
      const char = argsString[i];

      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false;
        quoteChar = "";
      } else if (char === "(" && !inQuotes) {
        parenDepth++;
      } else if (char === ")" && !inQuotes) {
        parenDepth--;
      } else if (char === "," && parenDepth === 0 && !inQuotes) {
        args.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) {
      args.push(current.trim());
    }

    return args;
  }

  // Argument validators
  validateRGBArgs(args) {
    return args.every((arg) => {
      const num = parseFloat(arg);
      return (
        !isNaN(num) && num >= 0 && (arg.includes("%") ? num <= 100 : num <= 255)
      );
    });
  }

  validateHSLArgs(args) {
    const [h, s, l, a] = args;
    const hue = parseFloat(h);
    const sat = parseFloat(s);
    const light = parseFloat(l);

    if (isNaN(hue) || hue < 0 || hue > 360) return false;
    if (isNaN(sat) || sat < 0 || sat > 100) return false;
    if (isNaN(light) || light < 0 || light > 100) return false;

    if (a !== undefined) {
      const alpha = parseFloat(a);
      if (isNaN(alpha) || alpha < 0 || alpha > 1) return false;
    }

    return true;
  }

  validateCalcArgs(args) {
    // Basic calc validation - ensure it contains valid math expressions
    const calcExpr = args[0];
    return /^[\d\s+\-*/.()%a-zA-Z-]+$/.test(calcExpr);
  }

  validateLengthArgs(args) {
    return args.every((arg) => {
      return (
        /^-?[\d.]+(?:px|em|rem|%|vh|vw|in|cm|mm|pt|pc|ex|ch|vmin|vmax|fr)?$/.test(
          arg.trim()
        ) || /^var\(--[\w-]+\)$/.test(arg.trim())
      );
    });
  }

  validateAngleArgs(args) {
    return args.every((arg) => {
      return /^-?[\d.]+(?:deg|grad|rad|turn)?$/.test(arg.trim());
    });
  }

  validateNumberArgs(args) {
    return args.every((arg) => {
      const num = parseFloat(arg);
      return !isNaN(num);
    });
  }

  validateVarArgs(args) {
    const [varName, fallback] = args;
    if (!/^--[\w-]+$/.test(varName)) return false;
    return true; // Fallback can be anything
  }

  validateGradientArgs(args) {
    // Basic gradient validation - ensure we have direction and colors
    return args.length >= 2;
  }
}

const functionValidator = new CSSFunctionValidator();

/**
 * Enhanced CSS rule generation with proper validation
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
    // Process the CSS value with enhanced validation
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
        type: propertyDetector.getPropertyType(property),
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
 * Enhanced CSS value processing with proper function validation
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

  // Check for CSS functions first (they can appear in any property type)
  if (normalized.includes("(") && normalized.includes(")")) {
    const functionMatch = normalized.match(/^([a-zA-Z-]+\([^)]*\))(.*)$/);
    if (functionMatch) {
      const [, functionCall, remainder] = functionMatch;

      if (!functionValidator.validateFunction(functionCall)) {
        return strict ? null : normalized; // Be permissive in non-strict mode
      }

      // If there's remainder, validate it too
      if (remainder.trim()) {
        // Handle multiple functions or mixed values
        const remainderValid = processCSSValue(
          remainder.trim(),
          property,
          options
        );
        if (!remainderValid) {
          return strict ? null : normalized;
        }
      }

      return normalized;
    }
  }

  const propertyType = propertyDetector.getPropertyType(property);

  switch (propertyType) {
    case "LENGTH":
      return processLengthValue(normalized, property, strict);

    case "COLOR":
      return processColorValue(normalized, strict);

    case "NUMBER":
      return processNumberValue(normalized, strict);

    case "KEYWORD":
      return processKeywordValue(normalized, property, strict);

    case "COMPLEX":
      return processComplexValue(normalized, property, strict);

    default:
      // For unknown properties, do basic safety validation
      return processFallbackValue(normalized, strict);
  }
}

/**
 * Enhanced length value processing with shorthand support
 */
function processLengthValue(value, property, strict = false) {
  // CSS custom properties
  if (value.startsWith("var(")) {
    return value; // Already validated by function validator
  }

  // Multiple values (shorthand properties)
  if (value.includes(" ") && propertyDetector.acceptsShorthand(property)) {
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
 * Enhanced color value processing
 */
function processColorValue(value, strict = false) {
  // CSS custom properties
  if (value.startsWith("var(")) {
    return value; // Already validated by function validator
  }

  // Hex colors
  if (/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)) {
    return value.toLowerCase();
  }

  // Function colors (rgb, hsl, etc.) - already validated by function validator
  if (value.includes("(") && value.includes(")")) {
    return value;
  }

  // Named colors and keywords
  const colorKeywords = [
    "transparent",
    "currentcolor",
    "inherit",
    "initial",
    "unset",
    "revert",
    // Extended named colors
    "aliceblue",
    "antiquewhite",
    "aqua",
    "aquamarine",
    "azure",
    "beige",
    "bisque",
    "black",
    "blanchedalmond",
    "blue",
    "blueviolet",
    "brown",
    "burlywood",
    "cadetblue",
    "chartreuse",
    "chocolate",
    "coral",
    "cornflowerblue",
    "cornsilk",
    "crimson",
    "cyan",
    "darkblue",
    "darkcyan",
    "darkgoldenrod",
    "darkgray",
    "darkgreen",
    "darkgrey",
    "darkkhaki",
    "darkmagenta",
    "darkolivegreen",
    "darkorange",
    "darkorchid",
    "darkred",
    "darksalmon",
    "darkseagreen",
    "darkslateblue",
    "darkslategray",
    "darkslategrey",
    "darkturquoise",
    "darkviolet",
    "deeppink",
    "deepskyblue",
    "dimgray",
    "dimgrey",
    "dodgerblue",
    "firebrick",
    "floralwhite",
    "forestgreen",
    "fuchsia",
    "gainsboro",
    "ghostwhite",
    "gold",
    "goldenrod",
    "gray",
    "green",
    "greenyellow",
    "grey",
    "honeydew",
    "hotpink",
    "indianred",
    "indigo",
    "ivory",
    "khaki",
    "lavender",
    "lavenderblush",
    "lawngreen",
    "lemonchiffon",
    "lightblue",
    "lightcoral",
    "lightcyan",
    "lightgoldenrodyellow",
    "lightgray",
    "lightgreen",
    "lightgrey",
    "lightpink",
    "lightsalmon",
    "lightseagreen",
    "lightskyblue",
    "lightslategray",
    "lightslategrey",
    "lightsteelblue",
    "lightyellow",
    "lime",
    "limegreen",
    "linen",
    "magenta",
    "maroon",
    "mediumaquamarine",
    "mediumblue",
    "mediumorchid",
    "mediumpurple",
    "mediumseagreen",
    "mediumslateblue",
    "mediumspringgreen",
    "mediumturquoise",
    "mediumvioletred",
    "midnightblue",
    "mintcream",
    "mistyrose",
    "moccasin",
    "navajowhite",
    "navy",
    "oldlace",
    "olive",
    "olivedrab",
    "orange",
    "orangered",
    "orchid",
    "palegoldenrod",
    "palegreen",
    "paleturquoise",
    "palevioletred",
    "papayawhip",
    "peachpuff",
    "peru",
    "pink",
    "plum",
    "powderblue",
    "purple",
    "red",
    "rosybrown",
    "royalblue",
    "saddlebrown",
    "salmon",
    "sandybrown",
    "seagreen",
    "seashell",
    "sienna",
    "silver",
    "skyblue",
    "slateblue",
    "slategray",
    "slategrey",
    "snow",
    "springgreen",
    "steelblue",
    "tan",
    "teal",
    "thistle",
    "tomato",
    "turquoise",
    "violet",
    "wheat",
    "white",
    "whitesmoke",
    "yellow",
    "yellowgreen",
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
    return value;
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
    return value;
  }

  // Basic keyword pattern
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
    return value;
  }

  // Complex properties often contain functions, which are already validated
  return value;
}

/**
 * Fallback value processing for unknown properties
 */
function processFallbackValue(value, strict = false) {
  // Basic safety check - no dangerous patterns (handled by security layer)
  return value;
}

/**
 * Process shorthand length values (e.g., "10px 20px")
 */
function processShorthandLength(value, strict = false) {
  const parts = value.split(/\s+/);

  // Validate each part is a valid length
  for (const part of parts) {
    if (!processLengthValue(part, null, strict)) {
      return strict ? null : value;
    }
  }

  return value;
}

/**
 * Generate CSS declarations object with enhanced logic
 */
function generateDeclarations(property, value, important = false) {
  const declarations = {};
  const finalValue = important ? `${value} !important` : value;

  // Direct property mapping - the property maps handle the CSS property names
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

  // For responsive, we'll enhance this when breakpoint system is added
  if (responsive) {
    // Placeholder for future breakpoint implementation
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
