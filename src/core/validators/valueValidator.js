/**
 * CSS value validation logic with comprehensive syntax checking
 * Validates CSS values against property types, units, ranges, and patterns
 */

import { isSafeInput } from "../security/index.js";
import {
  isCSSLength,
  isCSSColor,
  normalizeCSSValue,
  PROCESSING_CONSTANTS,
  CSS_UNITS,
} from "../utils/index.js";

/**
 * Property-specific validation rules
 */
const PROPERTY_VALIDATION_RULES = {
  // Length properties
  padding: {
    type: "length",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
    allowCalc: true,
  },
  margin: { type: "length", min: null, allowNegative: true, allowCalc: true },
  width: {
    type: "length",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
    allowKeywords: ["auto", "min-content", "max-content", "fit-content"],
  },
  height: {
    type: "length",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
    allowKeywords: ["auto", "min-content", "max-content", "fit-content"],
  },
  "border-radius": {
    type: "length",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
    allowPercentage: true,
  },
  "font-size": {
    type: "length",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
    allowKeywords: [
      "xx-small",
      "x-small",
      "small",
      "medium",
      "large",
      "x-large",
      "xx-large",
    ],
  },
  "line-height": {
    type: "length-or-number",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
    allowUnitless: true,
  },

  // Color properties
  color: { type: "color", allowKeywords: ["currentcolor", "transparent"] },
  "background-color": {
    type: "color",
    allowKeywords: ["currentcolor", "transparent"],
  },
  "border-color": {
    type: "color",
    allowKeywords: ["currentcolor", "transparent"],
  },

  // Number properties
  opacity: {
    type: "number",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    max: PROCESSING_CONSTANTS.OPACITY_MAX,
    allowPercentage: true,
  },
  "z-index": { type: "integer", allowKeywords: ["auto"] },
  "flex-grow": {
    type: "number",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
  },
  "flex-shrink": {
    type: "number",
    min: PROCESSING_CONSTANTS.MIN_ZERO,
    allowNegative: false,
  },

  // Keyword properties
  display: {
    type: "keyword",
    values: [
      "none",
      "block",
      "inline",
      "inline-block",
      "flex",
      "grid",
      "table",
      "table-cell",
      "table-row",
    ],
  },
  position: {
    type: "keyword",
    values: ["static", "relative", "absolute", "fixed", "sticky"],
  },
  "text-align": {
    type: "keyword",
    values: ["left", "right", "center", "justify", "start", "end"],
  },
  "font-weight": {
    type: "keyword-or-number",
    values: ["normal", "bold", "bolder", "lighter"],
    numberRange: [
      PROCESSING_CONSTANTS.FONT_WEIGHT_MIN,
      PROCESSING_CONSTANTS.FONT_WEIGHT_MAX,
    ],
  },

  // Complex properties
  transform: {
    type: "function",
    functions: ["translate", "rotate", "scale", "skew", "matrix"],
  },
  "box-shadow": {
    type: "complex",
    pattern:
      /^(?:none|(?:inset\s+)?(?:[+-]?\d*\.?\d+(?:px|em|rem|%)\s+){2,4}(?:rgba?\([^)]+\)|hsla?\([^)]+\)|#[0-9a-fA-F]{3,8}|[a-zA-Z]+)?)$/,
  },
  background: { type: "complex", allowMultiple: true },
};

/**
 * Enhanced CSS value validation for a given property
 * @param {string} value - CSS value to validate
 * @param {string} property - CSS property name
 * @param {Object} options - Validation options
 * @returns {Object} Comprehensive validation result
 */
export function validateValue(value, property, options = {}) {
  const {
    strict = false,
    allowCustomProperties = true,
    context = {},
  } = options;

  if (!value || typeof value !== "string") {
    return createValidationResult(
      false,
      "Value must be a non-empty string",
      value
    );
  }

  // Security check first
  if (!isSafeInput(value)) {
    return createValidationResult(
      false,
      "Value contains unsafe patterns",
      value
    );
  }

  // Normalize the value using utility
  const normalizedValue = normalizeCSSValue(value);

  // Handle CSS custom properties
  if (allowCustomProperties && normalizedValue.startsWith("var(")) {
    return validateCustomProperty(normalizedValue, strict);
  }

  // Handle CSS global keywords
  if (isGlobalKeyword(normalizedValue)) {
    return createValidationResult(true, null, normalizedValue, {
      type: "global-keyword",
    });
  }

  // Get property-specific validation rules
  const rules = getPropertyRules(property);
  if (!rules) {
    // Unknown property - use fallback validation
    return validateUnknownProperty(normalizedValue, strict);
  }

  // Enhanced validation using utilities for common types
  if (rules.type === "color" && isCSSColor(normalizedValue)) {
    return createValidationResult(true, null, normalizedValue, {
      type: "color",
      utilityValidated: true,
    });
  }

  if (rules.type === "length" && isCSSLength(normalizedValue)) {
    return createValidationResult(true, null, normalizedValue, {
      type: "length",
      utilityValidated: true,
    });
  }

  // Validate based on property type
  switch (rules.type) {
    case "length":
      return validateLengthValue(normalizedValue, rules, strict);

    case "length-or-number":
      return validateLengthOrNumber(normalizedValue, rules, strict);

    case "color":
      return validateColorValue(normalizedValue, rules, strict);

    case "number":
      return validateNumberValue(normalizedValue, rules, strict);

    case "integer":
      return validateIntegerValue(normalizedValue, rules, strict);

    case "keyword":
      return validateKeywordValue(normalizedValue, rules, strict);

    case "keyword-or-number":
      return validateKeywordOrNumber(normalizedValue, rules, strict);

    case "function":
      return validateFunctionValue(normalizedValue, rules, strict);

    case "complex":
      return validateComplexValue(normalizedValue, rules, strict);

    default:
      return validateFallbackValue(normalizedValue, strict);
  }
}

/**
 * Validate CSS custom property (var() function)
 */
function validateCustomProperty(value, strict = false) {
  const varPattern = /^var\(\s*(--[a-zA-Z0-9-_]+)\s*(?:,\s*([^)]+))?\s*\)$/;
  const match = value.match(varPattern);

  if (!match) {
    return createValidationResult(false, "Invalid var() syntax", value);
  }

  const [, propertyName, fallbackValue] = match;

  // Validate property name
  if (!propertyName.startsWith("--")) {
    return createValidationResult(
      false,
      "Custom property name must start with --",
      value
    );
  }

  // Validate fallback value if present
  if (fallbackValue) {
    const trimmedFallback = fallbackValue.trim();
    if (!trimmedFallback) {
      return createValidationResult(false, "Empty fallback value", value);
    }
  }

  return createValidationResult(true, null, value, {
    type: "custom-property",
    propertyName,
    fallbackValue: fallbackValue ? fallbackValue.trim() : null,
  });
}

/**
 * Validate length values (px, em, rem, %, etc.)
 */
function validateLengthValue(value, rules, strict = false) {
  const trimmed = value.trim();

  // Handle calc() function
  if (trimmed.startsWith("calc(")) {
    return validateCalcFunction(trimmed, "length", strict);
  }

  // Handle keywords
  if (rules.allowKeywords && rules.allowKeywords.includes(trimmed)) {
    return createValidationResult(true, null, value, { type: "keyword" });
  }

  // Handle zero without unit
  if (trimmed === "0") {
    return createValidationResult(true, null, value, {
      type: "length",
      value: 0,
      unit: null,
    });
  }

  // Parse length value
  const lengthMatch = trimmed.match(/^([+-]?\d*\.?\d+)([a-zA-Z%]+)$/);
  if (lengthMatch) {
    const [, numStr, unit] = lengthMatch;
    const numValue = parseFloat(numStr);

    // Validate unit
    if (!isValidLengthUnit(unit)) {
      return createValidationResult(
        false,
        `Invalid length unit: ${unit}`,
        value
      );
    }

    // Check value constraints
    if (rules.min !== null && rules.min !== undefined && numValue < rules.min) {
      return createValidationResult(
        false,
        `Value ${numValue} is below minimum ${rules.min}`,
        value
      );
    }

    if (rules.max !== null && rules.max !== undefined && numValue > rules.max) {
      return createValidationResult(
        false,
        `Value ${numValue} is above maximum ${rules.max}`,
        value
      );
    }

    if (!rules.allowNegative && numValue < 0) {
      return createValidationResult(
        false,
        "Negative values not allowed",
        value
      );
    }

    return createValidationResult(true, null, value, {
      type: "length",
      value: numValue,
      unit,
      unitType: getLengthUnitType(unit),
    });
  }

  // If not a valid length or allowed keyword, reject
  return createValidationResult(
    false,
    "Invalid value for length property",
    value
  );
}

/**
 * Validate length or unitless number values
 */
function validateLengthOrNumber(value, rules, strict = false) {
  const trimmed = value.trim();

  // Try as unitless number first
  const numberMatch = trimmed.match(/^([+-]?\d*\.?\d+)$/);
  if (numberMatch) {
    if (!rules.allowUnitless) {
      return createValidationResult(
        false,
        "Unitless numbers not allowed for this property",
        value
      );
    }

    const numValue = parseFloat(numberMatch[1]);

    // Check constraints
    if (rules.min !== null && rules.min !== undefined && numValue < rules.min) {
      return createValidationResult(
        false,
        `Value ${numValue} is below minimum ${rules.min}`,
        value
      );
    }

    if (!rules.allowNegative && numValue < 0) {
      return createValidationResult(
        false,
        "Negative values not allowed",
        value
      );
    }

    return createValidationResult(true, null, value, {
      type: "number",
      value: numValue,
      unitless: true,
    });
  }

  // Fall back to length validation
  return validateLengthValue(value, rules, strict);
}

/**
 * Validate color values (hex, rgb, hsl, named colors)
 */
function validateColorValue(value, rules, strict = false) {
  const trimmed = value.trim().toLowerCase();

  // Handle keywords
  if (rules.allowKeywords && rules.allowKeywords.includes(trimmed)) {
    return createValidationResult(true, null, value, { type: "color-keyword" });
  }

  // Named colors
  if (isNamedColor(trimmed)) {
    return createValidationResult(true, null, value, { type: "named-color" });
  }

  // Hex colors
  if (trimmed.startsWith("#")) {
    return validateHexColor(trimmed, strict);
  }

  // RGB/RGBA function
  if (trimmed.startsWith("rgb")) {
    return validateRGBColor(trimmed, strict);
  }

  // HSL/HSLA function
  if (trimmed.startsWith("hsl")) {
    return validateHSLColor(trimmed, strict);
  }

  return createValidationResult(false, "Invalid color format", value);
}

/**
 * Validate hex color values
 */
function validateHexColor(value, strict = false) {
  const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

  if (!hexPattern.test(value)) {
    return createValidationResult(false, "Invalid hex color format", value);
  }

  const hex = value.slice(1);
  const channels = hex.length === 3 ? 3 : hex.length === 6 ? 6 : 8;

  return createValidationResult(true, null, value, {
    type: "hex-color",
    channels: channels === 3 ? "rgb-short" : channels === 6 ? "rgb" : "rgba",
    hasAlpha: channels === 8,
  });
}

/**
 * Validate RGB/RGBA color functions
 */
function validateRGBColor(value, strict = false) {
  // Modern syntax: rgb(255 128 0) or rgb(255 128 0 / 0.5)
  const modernPattern =
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?|\d+(?:\.\d+)?%))?\s*\)$/;

  // Legacy syntax: rgb(255, 128, 0) or rgba(255, 128, 0, 0.5)
  const legacyPattern =
    /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)$/;

  let match = value.match(modernPattern) || value.match(legacyPattern);

  if (!match) {
    return createValidationResult(false, "Invalid RGB color syntax", value);
  }

  const [, r, g, b, a] = match;

  // Validate RGB values (0-255)
  const rgb = [r, g, b].map(Number);
  for (const channel of rgb) {
    if (
      channel < PROCESSING_CONSTANTS.RGB_MIN ||
      channel > PROCESSING_CONSTANTS.RGB_MAX
    ) {
      return createValidationResult(
        false,
        `RGB channel value ${channel} out of range (${PROCESSING_CONSTANTS.RGB_MIN}-${PROCESSING_CONSTANTS.RGB_MAX})`,
        value
      );
    }
  }

  // Validate alpha value (0-1)
  if (a !== undefined) {
    const alpha = Number(a);
    if (alpha < 0 || alpha > 1) {
      return createValidationResult(
        false,
        `Alpha value ${alpha} out of range (0-1)`,
        value
      );
    }
  }

  return createValidationResult(true, null, value, {
    type: "rgb-color",
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
    a: a !== undefined ? Number(a) : undefined,
    hasAlpha: a !== undefined,
  });
}

/**
 * Validate HSL/HSLA color functions
 */
function validateHSLColor(value, strict = false) {
  // Modern syntax: hsl(120 100% 50%) or hsl(120 100% 50% / 0.5)
  const modernPattern =
    /^hsla?\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%\s*(?:\/\s*(\d+(?:\.\d+)?|\d+(?:\.\d+)?%))?\s*\)$/;

  // Legacy syntax: hsl(120, 100%, 50%) or hsla(120, 100%, 50%, 0.5)
  const legacyPattern =
    /^hsla?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)%\s*,\s*(\d+(?:\.\d+)?)%\s*(?:,\s*(\d+(?:\.\d+)?))?\s*\)$/;

  let match = value.match(modernPattern) || value.match(legacyPattern);

  if (!match) {
    return createValidationResult(false, "Invalid HSL color syntax", value);
  }

  const [, h, s, l, a] = match;

  // Validate hue (0-360)
  const hue = Number(h);
  if (
    hue < PROCESSING_CONSTANTS.HSL_HUE_MIN ||
    hue > PROCESSING_CONSTANTS.HSL_HUE_MAX
  ) {
    return createValidationResult(
      false,
      `Hue value ${hue} out of range (${PROCESSING_CONSTANTS.HSL_HUE_MIN}-${PROCESSING_CONSTANTS.HSL_HUE_MAX})`,
      value
    );
  }

  // Validate saturation and lightness (0-100%)
  const saturation = Number(s);
  const lightness = Number(l);

  if (
    saturation < PROCESSING_CONSTANTS.HSL_PERCENTAGE_MIN ||
    saturation > PROCESSING_CONSTANTS.HSL_PERCENTAGE_MAX
  ) {
    return createValidationResult(
      false,
      `Saturation value ${saturation}% out of range (${PROCESSING_CONSTANTS.HSL_PERCENTAGE_MIN}-${PROCESSING_CONSTANTS.HSL_PERCENTAGE_MAX}%)`,
      value
    );
  }

  if (
    lightness < PROCESSING_CONSTANTS.HSL_PERCENTAGE_MIN ||
    lightness > PROCESSING_CONSTANTS.HSL_PERCENTAGE_MAX
  ) {
    return createValidationResult(
      false,
      `Lightness value ${lightness}% out of range (${PROCESSING_CONSTANTS.HSL_PERCENTAGE_MIN}-${PROCESSING_CONSTANTS.HSL_PERCENTAGE_MAX}%)`,
      value
    );
  }

  // Validate alpha value (0-1)
  if (a !== undefined) {
    const alpha = Number(a);
    if (
      alpha < PROCESSING_CONSTANTS.ALPHA_MIN ||
      alpha > PROCESSING_CONSTANTS.ALPHA_MAX
    ) {
      return createValidationResult(
        false,
        `Alpha value ${alpha} out of range (${PROCESSING_CONSTANTS.ALPHA_MIN}-${PROCESSING_CONSTANTS.ALPHA_MAX})`,
        value
      );
    }
  }

  return createValidationResult(true, null, value, {
    type: "hsl-color",
    h: hue,
    s: saturation,
    l: lightness,
    a: a !== undefined ? Number(a) : undefined,
    hasAlpha: a !== undefined,
  });
}

/**
 * Validate calc() function
 */
function validateCalcFunction(value, expectedType = "length", strict = false) {
  if (!value.startsWith("calc(") || !value.endsWith(")")) {
    return createValidationResult(false, "Invalid calc() syntax", value);
  }

  const expression = value.slice(5, -1).trim();

  if (!expression) {
    return createValidationResult(false, "Empty calc() expression", value);
  }

  // Basic validation - check for balanced parentheses
  if (!hasBalancedParentheses(expression)) {
    return createValidationResult(
      false,
      "Unbalanced parentheses in calc()",
      value
    );
  }

  // Validate calc expression components
  const validationResult = validateCalcExpression(
    expression,
    expectedType,
    strict
  );

  if (!validationResult.isValid) {
    return validationResult;
  }

  return createValidationResult(true, null, value, {
    type: "calc-function",
    expression,
    expectedType,
    ...validationResult.metadata,
  });
}

/**
 * Create standardized validation result
 */
function createValidationResult(
  isValid,
  reason = null,
  value = null,
  metadata = {}
) {
  return {
    isValid,
    reason,
    value,
    metadata: {
      timestamp: Date.now(),
      ...metadata,
    },
  };
}

/**
 * Get property-specific validation rules
 */
function getPropertyRules(property) {
  return PROPERTY_VALIDATION_RULES[property] || null;
}

/**
 * Check if value is a CSS global keyword
 */
function isGlobalKeyword(value) {
  const globalKeywords = [
    "inherit",
    "initial",
    "unset",
    "revert",
    "revert-layer",
  ];
  return globalKeywords.includes(value.toLowerCase());
}

/**
 * Check if unit is a valid length unit
 */
function isValidLengthUnit(unit) {
  const allUnits = [
    ...CSS_UNITS.LENGTH.absolute,
    ...CSS_UNITS.LENGTH.relative,
    ...CSS_UNITS.LENGTH.viewport,
    ...CSS_UNITS.LENGTH.percentage,
    ...CSS_UNITS.LENGTH.flexible,
  ];
  return allUnits.includes(unit.toLowerCase());
}

/**
 * Get length unit type
 */
function getLengthUnitType(unit) {
  const unitLower = unit.toLowerCase();

  if (CSS_UNITS.LENGTH.absolute.includes(unitLower)) return "absolute";
  if (CSS_UNITS.LENGTH.relative.includes(unitLower)) return "relative";
  if (CSS_UNITS.LENGTH.viewport.includes(unitLower)) return "viewport";
  if (CSS_UNITS.LENGTH.percentage.includes(unitLower)) return "percentage";
  if (CSS_UNITS.LENGTH.flexible.includes(unitLower)) return "flexible";

  return "unknown";
}

/**
 * Check if value is a named color
 */
function isNamedColor(value) {
  const namedColors = [
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

  return namedColors.includes(value.toLowerCase());
}

/**
 * Validate number values
 */
function validateNumberValue(value, rules, strict = false) {
  const trimmed = value.trim();

  // Handle keywords
  if (rules.allowKeywords && rules.allowKeywords.includes(trimmed)) {
    return createValidationResult(true, null, value, { type: "keyword" });
  }

  // Handle percentage if allowed
  if (rules.allowPercentage && trimmed.endsWith("%")) {
    const percentValue = parseFloat(trimmed.slice(0, -1));
    if (isNaN(percentValue)) {
      return createValidationResult(false, "Invalid percentage format", value);
    }

    return createValidationResult(true, null, value, {
      type: "percentage",
      value: percentValue,
    });
  }

  // Parse as number
  const numValue = parseFloat(trimmed);
  if (isNaN(numValue)) {
    return createValidationResult(false, "Invalid number format", value);
  }

  // Check constraints
  if (rules.min !== null && rules.min !== undefined && numValue < rules.min) {
    return createValidationResult(
      false,
      `Value ${numValue} is below minimum ${rules.min}`,
      value
    );
  }

  if (rules.max !== null && rules.max !== undefined && numValue > rules.max) {
    return createValidationResult(
      false,
      `Value ${numValue} is above maximum ${rules.max}`,
      value
    );
  }

  if (!rules.allowNegative && numValue < 0) {
    return createValidationResult(false, "Negative values not allowed", value);
  }

  return createValidationResult(true, null, value, {
    type: "number",
    value: numValue,
  });
}

/**
 * Validate integer values
 */
function validateIntegerValue(value, rules, strict = false) {
  const trimmed = value.trim();

  // Handle keywords
  if (rules.allowKeywords && rules.allowKeywords.includes(trimmed)) {
    return createValidationResult(true, null, value, { type: "keyword" });
  }

  // Parse as integer
  const intValue = parseInt(trimmed, 10);
  if (isNaN(intValue) || intValue.toString() !== trimmed) {
    return createValidationResult(false, "Invalid integer format", value);
  }

  // Check constraints
  if (rules.min !== null && rules.min !== undefined && intValue < rules.min) {
    return createValidationResult(
      false,
      `Value ${intValue} is below minimum ${rules.min}`,
      value
    );
  }

  if (rules.max !== null && rules.max !== undefined && intValue > rules.max) {
    return createValidationResult(
      false,
      `Value ${intValue} is above maximum ${rules.max}`,
      value
    );
  }

  return createValidationResult(true, null, value, {
    type: "integer",
    value: intValue,
  });
}

/**
 * Validate keyword values
 */
function validateKeywordValue(value, rules, strict = false) {
  const trimmed = value.trim().toLowerCase();

  if (!rules.values || !Array.isArray(rules.values)) {
    return createValidationResult(
      false,
      "No valid keywords defined for property",
      value
    );
  }

  if (!rules.values.includes(trimmed)) {
    const suggestion = findClosestKeyword(trimmed, rules.values);
    const reason = suggestion
      ? `Invalid keyword '${trimmed}'. Did you mean '${suggestion}'?`
      : `Invalid keyword '${trimmed}'. Valid values: ${rules.values.join(", ")}`;

    return createValidationResult(false, reason, value);
  }

  return createValidationResult(true, null, value, {
    type: "keyword",
    keyword: trimmed,
  });
}

/**
 * Validate keyword or number values (e.g., font-weight)
 */
function validateKeywordOrNumber(value, rules, strict = false) {
  const trimmed = value.trim();

  // Try keyword validation first
  if (rules.values && rules.values.includes(trimmed.toLowerCase())) {
    return createValidationResult(true, null, value, {
      type: "keyword",
      keyword: trimmed.toLowerCase(),
    });
  }

  // Try number validation
  if (rules.numberRange) {
    const numValue = parseFloat(trimmed);
    if (!isNaN(numValue)) {
      const [min, max] = rules.numberRange;

      if (numValue >= min && numValue <= max) {
        return createValidationResult(true, null, value, {
          type: "number",
          value: numValue,
        });
      } else {
        return createValidationResult(
          false,
          `Number ${numValue} out of range ${min}-${max}`,
          value
        );
      }
    }
  }

  return createValidationResult(
    false,
    "Value must be a valid keyword or number",
    value
  );
}

/**
 * Validate function values (e.g., transform functions)
 */
function validateFunctionValue(value, rules, strict = false) {
  const trimmed = value.trim();

  // Extract function name
  const functionMatch = trimmed.match(/^([a-zA-Z-]+)\(/);
  if (!functionMatch) {
    return createValidationResult(false, "Invalid function syntax", value);
  }

  const functionName = functionMatch[1].toLowerCase();

  // Check if function is allowed
  if (rules.functions && !rules.functions.includes(functionName)) {
    return createValidationResult(
      false,
      `Function '${functionName}' not allowed for this property`,
      value
    );
  }

  // Basic function syntax validation
  if (!trimmed.endsWith(")")) {
    return createValidationResult(false, "Missing closing parenthesis", value);
  }

  return createValidationResult(true, null, value, {
    type: "function",
    functionName,
  });
}

/**
 * Validate complex values using patterns
 */
function validateComplexValue(value, rules, strict = false) {
  const trimmed = value.trim();

  // Use pattern if provided
  if (rules.pattern && !rules.pattern.test(trimmed)) {
    return createValidationResult(
      false,
      "Value does not match expected pattern",
      value
    );
  }

  return createValidationResult(true, null, value, {
    type: "complex",
  });
}

/**
 * Validate unknown property with fallback rules
 */
function validateUnknownProperty(value, strict = false) {
  if (strict) {
    return createValidationResult(
      false,
      "Unknown property - strict mode",
      value
    );
  }

  // Basic safety check
  const dangerousPatterns = /javascript:|data:|expression\(/i;
  if (dangerousPatterns.test(value)) {
    return createValidationResult(
      false,
      "Value contains dangerous patterns",
      value
    );
  }

  return createValidationResult(true, null, value, {
    type: "unknown",
    warning: "Property not recognized - basic validation only",
  });
}

/**
 * Validate fallback values
 */
function validateFallbackValue(value, strict = false) {
  return validateUnknownProperty(value, strict);
}

/**
 * Validate calc() expression components
 */
function validateCalcExpression(expression, expectedType, strict = false) {
  // Basic validation - ensure it contains valid calc components
  const calcPattern = /^[\d\s+\-*/.()%a-zA-Z-]+$/;

  if (!calcPattern.test(expression)) {
    return createValidationResult(
      false,
      "Invalid characters in calc() expression",
      expression
    );
  }

  // Check for division by zero (basic check)
  if (expression.includes("/0") || expression.includes("/ 0")) {
    return createValidationResult(
      false,
      "Division by zero in calc() expression",
      expression
    );
  }

  return createValidationResult(true, null, expression, {
    type: "calc-expression",
    expectedType,
  });
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

/**
 * Find closest keyword using Levenshtein distance
 */
function findClosestKeyword(input, keywords) {
  let closest = null;
  let minDistance = Infinity;

  for (const keyword of keywords) {
    const distance = levenshteinDistance(input, keyword);
    if (distance < minDistance && distance <= 2) {
      // Max 2 character difference
      minDistance = distance;
      closest = keyword;
    }
  }

  return closest;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}

/**
 * Validate multiple values with comprehensive reporting
 * @param {Array<string>} values - Array of values to validate
 * @param {string} property - CSS property name
 * @param {Object} options - Validation options
 * @returns {Object} Batch validation results
 */
export function validateMultipleValues(values, property, options = {}) {
  const results = [];
  const errors = [];

  for (let i = 0; i < values.length; i++) {
    const result = validateValue(values[i], property, options);

    if (result.isValid) {
      results.push({ index: i, value: values[i], result });
    } else {
      errors.push({ index: i, value: values[i], error: result.reason });
    }
  }

  return {
    results,
    errors,
    summary: {
      total: values.length,
      valid: results.length,
      invalid: errors.length,
      successRate: results.length / values.length,
    },
  };
}

/**
 * Check if a CSS function is valid and safe
 * @param {string} value - Value to check
 * @returns {boolean} True if valid CSS function
 */
export function isValidCSSFunction(value) {
  const result = validateValue(value, "transform", { strict: false });
  return (
    result.isValid &&
    (result.metadata.type === "function" ||
      result.metadata.type === "calc-function")
  );
}
