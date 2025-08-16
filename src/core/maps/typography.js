/**
 * Typography utility mappings for ZyraCSS
 * Using native CSS property names (not Tailwind-style abbreviations)
 * Format: [prefix, css-property]
 */

export const TYPOGRAPHY_MAP = new Map([
  // Font shorthand property
  ["font", "font"],

  // Font family
  ["font-family", "font-family"],
  ["ff", "font-family"], // Short form

  // Font size
  ["font-size", "font-size"],
  ["fs", "font-size"], // Short form

  // Font weight
  ["font-weight", "font-weight"],
  ["fw", "font-weight"], // Short form

  // Font style
  ["font-style", "font-style"],

  // Content property
  ["content", "content"],

  // Line height - using actual CSS property name
  ["line-height", "line-height"],
  ["lh", "line-height"], // Short form

  // Letter spacing - using actual CSS property name
  ["letter-spacing", "letter-spacing"],
  ["ls", "letter-spacing"], // Short form

  // Text alignment
  ["text-align", "text-align"],
  ["ta", "text-align"], // Short form

  // Text decoration
  ["text-decoration", "text-decoration"],
  ["td", "text-decoration"], // Short form

  // Text transform
  ["text-transform", "text-transform"],
  ["tt", "text-transform"], // Short form
]);
