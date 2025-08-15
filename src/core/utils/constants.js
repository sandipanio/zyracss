/**
 * Shared constants used across ZyraCSS
 * Non-security related constants and configuration
 */

import { getVersionInfo } from "./version.js";

// CSS unit types
export const CSS_UNITS = {
  LENGTH: [
    "px",
    "em",
    "rem",
    "vh",
    "vw",
    "%",
    "in",
    "cm",
    "mm",
    "pt",
    "pc",
    "ex",
    "ch",
    "vmin",
    "vmax",
    "fr",
  ],
  ANGLE: ["deg", "grad", "rad", "turn"],
  TIME: ["s", "ms"],
  FREQUENCY: ["Hz", "kHz"],
  RESOLUTION: ["dpi", "dpcm", "dppx"],
};

// CSS property categories
export const PROPERTY_CATEGORIES = {
  SPACING: ["padding", "margin", "gap"],
  SIZING: [
    "width",
    "height",
    "min-width",
    "max-width",
    "min-height",
    "max-height",
  ],
  TYPOGRAPHY: [
    "font-size",
    "font-weight",
    "font-family",
    "line-height",
    "letter-spacing",
  ],
  COLOR: ["color", "background-color", "border-color"],
  LAYOUT: ["display", "position", "float", "clear", "overflow"],
  FLEXBOX: ["justify-content", "align-items", "flex-direction", "flex-wrap"],
  GRID: ["grid-template-columns", "grid-template-rows", "grid-gap"],
  BORDERS: ["border-width", "border-style", "border-radius"],
  EFFECTS: ["opacity", "box-shadow", "transform", "filter"],
};

// Default configuration values
export const DEFAULT_CONFIG = {
  minify: false,
  groupSelectors: true,
  includeComments: false,
  validateValues: true,
  stripComments: true,
};

// Performance thresholds
export const PERFORMANCE_THRESHOLDS = {
  SMALL_BATCH: 100, // Classes
  MEDIUM_BATCH: 1000, // Classes
  LARGE_BATCH: 5000, // Classes
  MAX_PROCESSING_TIME: 5000, // Milliseconds
  WARNING_TIME: 1000, // Milliseconds
};

// File processing constants
export const FILE_PATTERNS = {
  HTML: /\.html?$/i,
  JSX: /\.jsx?$/i,
  TSX: /\.tsx?$/i,
  VUE: /\.vue$/i,
  SVELTE: /\.svelte$/i,
  PHP: /\.php$/i,
};

// CSS value types for validation
export const VALUE_TYPES = {
  LENGTH: "length",
  COLOR: "color",
  NUMBER: "number",
  KEYWORD: "keyword",
  FUNCTION: "function",
  COMPLEX: "complex",
  MIXED: "mixed",
};

// Common CSS keywords
export const CSS_KEYWORDS = {
  GLOBAL: ["inherit", "initial", "unset", "revert"],
  DISPLAY: ["block", "inline", "inline-block", "flex", "grid", "none", "table"],
  POSITION: ["static", "relative", "absolute", "fixed", "sticky"],
  TEXT_ALIGN: ["left", "center", "right", "justify"],
  FONT_WEIGHT: ["normal", "bold", "bolder", "lighter"],
  OVERFLOW: ["visible", "hidden", "scroll", "auto"],
};

// Error codes for consistent error handling
export const ERROR_CODES = {
  INVALID_INPUT: "INVALID_INPUT",
  PARSING_FAILED: "PARSING_FAILED",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  GENERATION_FAILED: "GENERATION_FAILED",
  SECURITY_VIOLATION: "SECURITY_VIOLATION",
  RATE_LIMITED: "RATE_LIMITED",
  FILE_NOT_FOUND: "FILE_NOT_FOUND",
  PERMISSION_DENIED: "PERMISSION_DENIED",
};

// Success messages
export const SUCCESS_MESSAGES = {
  CSS_GENERATED: "CSS generated successfully",
  FILE_PROCESSED: "File processed successfully",
  VALIDATION_PASSED: "All inputs validated successfully",
  BUILD_COMPLETED: "Build completed successfully",
};

// API response formats
export const RESPONSE_FORMATS = {
  JSON: "json",
  CSS: "css",
  MINIFIED: "minified",
  PRETTY: "pretty",
};

// Version information
export const VERSION_INFO = getVersionInfo();

// Feature flags for gradual rollouts
export const FEATURE_FLAGS = {
  ADVANCED_CACHING: false,
  PARALLEL_PROCESSING: false,
  PLUGIN_SYSTEM: false,
  CUSTOM_PROPERTIES: true,
  LOGICAL_PROPERTIES: true,
};

// Debug levels
export const DEBUG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5,
};
