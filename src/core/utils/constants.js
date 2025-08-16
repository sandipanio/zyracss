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

// Cache configuration constants
export const CACHE_CONSTANTS = {
  // Cache sizes
  MAX_PARSE_CACHE: 5000,
  MAX_GENERATION_CACHE: 1000,
  MAX_RULE_CACHE: 10000,
  DEFAULT_CACHE_SIZE: 1000,
  KEY_CACHE_SIZE_DIVIDER: 2, // keyCacheMaxSize = maxSize / 2

  // TTL values (in milliseconds)
  TTL_ONE_HOUR: 60 * 60 * 1000, // 3600000ms
  TTL_THIRTY_MINUTES: 30 * 60 * 1000, // 1800000ms
  TTL_DEFAULT: 60 * 60 * 1000, // 1 hour default

  // Memory limits
  MAX_MEMORY_SIZE: 1024 * 1024, // 1MB
  RECOMMENDED_MEMORY_SIZE: 100 * 1024, // 100KB
};

// Processing constants
export const PROCESSING_CONSTANTS = {
  MAX_VALIDATION_BATCH: 1000,
  MAX_ENGINE_CLASSES: 10000,
  DECIMAL_PRECISION: 100, // For Math.round(value * 100) / 100
  PERCENTAGE_MAX: 100,
  PERCENTAGE_MIN: 0,
  PROGRESS_MIN: 0,
  PROGRESS_MAX: 100,

  // Basic validation constants
  MIN_ZERO: 0,
  OPACITY_MIN: 0,
  OPACITY_MAX: 1,

  // Color validation ranges
  RGB_MIN: 0,
  RGB_MAX: 255,
  HSL_PERCENTAGE_MIN: 0,
  HSL_PERCENTAGE_MAX: 100,
  HSL_HUE_MIN: 0,
  HSL_HUE_MAX: 360,
  ALPHA_MIN: 0,
  ALPHA_MAX: 1,

  // Font validation ranges
  FONT_WEIGHT_MIN: 1,
  FONT_WEIGHT_MAX: 1000,

  // Validation ranges
  NUMBER_RANGE_MIN: 1,
  NUMBER_RANGE_MAX: 1000,
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
