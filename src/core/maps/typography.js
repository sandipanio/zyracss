/**
 * Typography utility mappings for ZyraCSS
 * Covers font, font size, font weight, text decoration, line height, and letter spacing properties
 * Format: [prefix, css-property]
 */

export const TYPOGRAPHY_MAP = new Map([
  // Font shorthand property
  ["font", "font"],

  // Font family
  ["font-family", "font-family"],
  ["ff", "font-family"],

  // Font size
  ["font-size", "font-size"],
  ["fs", "font-size"],

  // Font weight
  ["font-weight", "font-weight"],
  ["fw", "font-weight"],

  // Font style (no short prefix)
  ["font-style", "font-style"],

  // Line height
  ["line-height", "line-height"],
  ["lh", "line-height"],

  // Letter spacing
  ["letter-spacing", "letter-spacing"],
  ["ls", "letter-spacing"],

  // Text alignment
  ["text-align", "text-align"],
  ["ta", "text-align"],

  // Text decoration
  ["text-decoration", "text-decoration"],
  ["td", "text-decoration"],

  // Text transform
  ["text-transform", "text-transform"],
  ["tt", "text-transform"],
]);
