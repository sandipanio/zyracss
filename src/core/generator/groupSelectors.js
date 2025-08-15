/**
 * CSS rule grouping and deduplication logic
 * Groups selectors with identical declarations for smaller CSS output
 */

/**
 * Group CSS rules with identical declarations
 * @param {Array} rules - Array of CSS rule objects
 * @returns {Array} Array of grouped rules
 */
export function groupIdenticalRules(rules) {
  const grouped = new Map();

  for (const rule of rules) {
    const key = rule.declarationString;

    if (grouped.has(key)) {
      // Add selector to existing group
      const existing = grouped.get(key);
      existing.selectors.push(rule.selector);
      existing.classNames.push(rule.className);
    } else {
      // Create new group
      grouped.set(key, {
        selectors: [rule.selector],
        declarations: rule.declarations,
        declarationString: rule.declarationString,
        classNames: [rule.className],
      });
    }
  }

  return Array.from(grouped.values());
}
