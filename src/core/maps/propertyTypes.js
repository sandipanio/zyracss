/**
 * CSS property type definitions for validation and processing
 * Categorizes CSS properties by their expected value types
 */

/**
 * CSS property type definitions for proper value handling
 */
export const CSS_PROPERTY_TYPES = {
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
    "padding-inline",
    "padding-block",
    "margin-inline",
    "margin-block",
    "padding-inline-start",
    "padding-inline-end",
    "padding-block-start",
    "padding-block-end",
    "margin-inline-start",
    "margin-inline-end",
    "margin-block-start",
    "margin-block-end",
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
    "caret-color",
    "accent-color",
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
    "font-weight",
    "line-height",
    "column-count",
    "tab-size",
  ]),

  KEYWORD: new Set([
    "display",
    "position",
    "overflow",
    "text-align",
    "font-style",
    "text-decoration",
    "text-transform",
    "white-space",
    "vertical-align",
    "float",
    "clear",
    "visibility",
    "cursor",
    "pointer-events",
    "user-select",
    "resize",
    "box-sizing",
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
    "clip-path",
    "mask",
    "background-image",
    "list-style",
    "content",
  ]),
};

/**
 * CSS unit categories for validation
 */
export const CSS_UNITS = {
  LENGTH: {
    absolute: ["px", "in", "cm", "mm", "pt", "pc"],
    relative: ["em", "rem", "ex", "ch", "lh", "rlh"],
    viewport: ["vw", "vh", "vmin", "vmax", "vi", "vb"],
    percentage: ["%"],
    flexible: ["fr"],
  },
  ANGLE: {
    units: ["deg", "grad", "rad", "turn"],
  },
  TIME: {
    units: ["s", "ms"],
  },
  FREQUENCY: {
    units: ["Hz", "kHz"],
  },
  RESOLUTION: {
    units: ["dpi", "dpcm", "dppx", "x"],
  },
};

/**
 * Get property type for value processing
 * @param {string} property - CSS property name
 * @returns {string} Property type
 */
export function getPropertyType(property) {
  for (const [type, properties] of Object.entries(CSS_PROPERTY_TYPES)) {
    if (properties.has(property)) {
      return type;
    }
  }
  return "UNKNOWN";
}

/**
 * Check if property expects a certain value type
 * @param {string} property - CSS property name
 * @param {string} expectedType - Expected type to check
 * @returns {boolean} True if property expects this type
 */
export function isPropertyType(property, expectedType) {
  const type = getPropertyType(property);
  return type === expectedType.toUpperCase();
}

/**
 * Get all properties of a specific type
 * @param {string} type - Property type
 * @returns {Set} Set of property names
 */
export function getPropertiesByType(type) {
  return CSS_PROPERTY_TYPES[type.toUpperCase()] || new Set();
}

/**
 * Check if unit is valid for property type
 * @param {string} unit - CSS unit
 * @param {string} propertyType - Property type
 * @returns {boolean} True if valid
 */
export function isValidUnitForPropertyType(unit, propertyType) {
  const unitLower = unit.toLowerCase();

  switch (propertyType.toUpperCase()) {
    case "LENGTH":
      return Object.values(CSS_UNITS.LENGTH).flat().includes(unitLower);
    case "ANGLE":
      return CSS_UNITS.ANGLE.units.includes(unitLower);
    case "TIME":
      return CSS_UNITS.TIME.units.includes(unitLower);
    case "FREQUENCY":
      return CSS_UNITS.FREQUENCY.units.includes(unitLower);
    case "RESOLUTION":
      return CSS_UNITS.RESOLUTION.units.includes(unitLower);
    default:
      return false;
  }
}

/**
 * Get valid units for a property
 * @param {string} property - CSS property name
 * @returns {Array<string>} Array of valid units
 */
export function getValidUnitsForProperty(property) {
  const propertyType = getPropertyType(property);

  switch (propertyType) {
    case "LENGTH":
      return Object.values(CSS_UNITS.LENGTH).flat();
    case "NUMBER":
      return []; // Numbers typically don't have units
    case "COLOR":
      return []; // Colors don't have traditional units
    case "KEYWORD":
      return []; // Keywords don't have units
    case "COMPLEX":
      return Object.values(CSS_UNITS)
        .flat()
        .map((category) =>
          Array.isArray(category) ? category : category.units || []
        )
        .flat();
    default:
      return [];
  }
}
