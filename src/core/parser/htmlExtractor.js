/**
 * HTML scanning and class extraction logic with safe regex execution
 * Finds utility classes within HTML content
 */

import { isInputLengthSafe, REGEX_TIMEOUTS } from "../security/safeRegex.js";

/**
 * Extract classes from HTML content with timeout protection
 * @param {string} html - HTML content to scan
 * @returns {Array} Array of found class names
 */
export function extractClassesFromHTML(html) {
  const classes = new Set();

  // Early return for unsafe input lengths
  if (!isInputLengthSafe(html, 100000)) {
    console.warn("HTML input too large for safe processing");
    return [];
  }

  // Match class attributes (both class and className for JSX)
  const classRegex = /class(Name)?=["']([^"']+)["']/g;

  // Use matchAll for safer execution instead of exec loop
  try {
    const matches = html.matchAll ? Array.from(html.matchAll(classRegex)) : [];

    matches.forEach((match) => {
      if (match && match[2]) {
        const classList = match[2].split(/\s+/);
        classList.forEach((cls) => {
          if (cls.trim()) {
            classes.add(cls.trim());
          }
        });
      }
    });
  } catch (error) {
    console.warn("HTML class extraction error:", error.message);
    return [];
  }

  return Array.from(classes);
}

/**
 * Extract classes from multiple HTML strings
 * @param {Array<string>} htmlArray - Array of HTML strings
 * @returns {Array} Array of unique class names found across all HTML
 */
export function extractClassesFromHTMLArray(htmlArray) {
  const allClasses = new Set();

  for (const html of htmlArray) {
    if (typeof html === "string") {
      const classes = extractClassesFromHTML(html);
      classes.forEach((cls) => allClasses.add(cls));
    }
  }

  return Array.from(allClasses);
}
