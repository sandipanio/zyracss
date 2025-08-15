/**
 * Core parser for ZyraCSS utility classes
 * Main coordination module that orchestrates parsing operations
 */

import { parseClass } from "./classParser.js";

/**
 * Parse multiple classes from various input types
 * @param {Array|string} input - Classes to parse
 * @returns {Array} Array of parsed class objects
 */
export function parseClasses(input) {
  let classes = [];

  if (Array.isArray(input)) {
    classes = input;
  } else if (typeof input === "string") {
    // Split string by whitespace to get individual classes
    classes = input.trim().split(/\s+/).filter(Boolean);
  } else {
    return [];
  }

  const parsed = [];
  const seen = new Set(); // Deduplication

  for (const className of classes) {
    if (seen.has(className)) continue;
    seen.add(className);

    const parsedClass = parseClass(className);
    if (parsedClass) {
      parsed.push(parsedClass);
    }
  }

  return parsed;
}

export { parseClass } from "./classParser.js";
export {
  extractClassesFromHTML,
  extractClassesFromHTMLArray,
} from "./htmlExtractor.js";
export { validateClassSyntax, generateSelector } from "./syntaxValidator.js";
export { parseCSSSyntax } from "./valueParser.js";
