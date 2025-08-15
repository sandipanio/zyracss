/**
 * ZyraCSS - Main package entry point
 * Exports the programmatic API for generating utility-first CSS
 */

// Core API exports
export {
  generateCSS,
  generateCSSFromHTML,
  generateCSSFromClasses,
} from "./api/generateCSS.js";

// Incremental engine for real-time editing
export { createEngine } from "./api/createEngine.js";

// Advanced API exports
export {
  generateMinifiedCSS,
  generateCSSWithDebug,
  validateClassNames,
  quickCSS,
  getCSSString,
  areValidClasses,
  estimateCSSSize,
  generateCSSWithProgress,
} from "./api/convenienceMethods.js";

// Utility exports for advanced usage
export { parseClasses, extractClassesFromHTML } from "./core/parser/index.js";
export { validateClasses } from "./core/validators/index.js";

// Version information
export { getVersion } from "./core/utils/version.js";

// Default export for convenience
export { generateCSS as default } from "./api/generateCSS.js";
