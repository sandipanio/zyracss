/**
 * HTML scanning and class extraction logic
 * Finds utility classes within HTML content
 */

/**
 * Extract classes from HTML content
 * @param {string} html - HTML content to scan
 * @returns {Array} Array of found class names
 */
export function extractClassesFromHTML(html) {
  const classes = new Set();

  // Match class attributes (both class and className for JSX)
  const classRegex = /class(Name)?=["']([^"']+)["']/g;

  let match;
  while ((match = classRegex.exec(html)) !== null) {
    const classList = match[2].split(/\s+/);
    classList.forEach((cls) => {
      if (cls.trim()) {
        classes.add(cls.trim());
      }
    });
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
