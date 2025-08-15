/**
 * Dangerous pattern detection for security
 * Identifies and blocks malicious content patterns
 */

import { DANGEROUS_PATTERNS } from "./securityConstants.js";

/**
 * Check if input contains dangerous patterns
 * @param {string} input - Input to check
 * @returns {Object} Detection result with details
 */
export function detectDangerousPatterns(input) {
  if (typeof input !== "string") {
    return {
      isDangerous: false,
      matchedPatterns: [],
      riskLevel: "none",
    };
  }

  const matchedPatterns = [];
  let highestRiskLevel = "none";

  // Check against all dangerous patterns
  for (const [patternName, patternInfo] of Object.entries(DANGEROUS_PATTERNS)) {
    if (patternInfo.regex.test(input)) {
      matchedPatterns.push({
        name: patternName,
        description: patternInfo.description,
        riskLevel: patternInfo.riskLevel,
        match: input.match(patternInfo.regex)?.[0],
      });

      // Update highest risk level
      if (
        getRiskPriority(patternInfo.riskLevel) >
        getRiskPriority(highestRiskLevel)
      ) {
        highestRiskLevel = patternInfo.riskLevel;
      }
    }
  }

  return {
    isDangerous: matchedPatterns.length > 0,
    matchedPatterns,
    riskLevel: highestRiskLevel,
    inputLength: input.length,
  };
}

/**
 * Get risk priority for comparison
 * @param {string} riskLevel - Risk level string
 * @returns {number} Priority number (higher = more dangerous)
 */
function getRiskPriority(riskLevel) {
  const priorities = {
    none: 0,
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  return priorities[riskLevel] || 0;
}

/**
 * Quick check if input is safe (no dangerous patterns)
 * @param {string} input - Input to check
 * @returns {boolean} True if safe, false if dangerous
 */
export function isSafeInput(input) {
  if (typeof input !== "string") {
    return false;
  }

  // Quick check against high-priority patterns first
  const highPriorityPatterns = Object.values(DANGEROUS_PATTERNS).filter(
    (pattern) =>
      pattern.riskLevel === "critical" || pattern.riskLevel === "high"
  );

  for (const pattern of highPriorityPatterns) {
    if (pattern.regex.test(input)) {
      return false;
    }
  }

  return true;
}

/**
 * Batch check multiple inputs for dangerous patterns
 * @param {Array<string>} inputs - Array of inputs to check
 * @returns {Object} Batch detection results
 */
export function batchDetectDangerousPatterns(inputs) {
  if (!Array.isArray(inputs)) {
    return {
      results: [],
      summary: {
        total: 0,
        safe: 0,
        dangerous: 0,
        highRisk: 0,
      },
    };
  }

  const results = [];
  let safe = 0;
  let dangerous = 0;
  let highRisk = 0;

  for (const input of inputs) {
    const detection = detectDangerousPatterns(input);
    results.push({
      input,
      ...detection,
    });

    if (detection.isDangerous) {
      dangerous++;
      if (
        detection.riskLevel === "high" ||
        detection.riskLevel === "critical"
      ) {
        highRisk++;
      }
    } else {
      safe++;
    }
  }

  return {
    results,
    summary: {
      total: inputs.length,
      safe,
      dangerous,
      highRisk,
      dangerousPercentage:
        inputs.length > 0 ? ((dangerous / inputs.length) * 100).toFixed(2) : 0,
    },
  };
}

/**
 * Get detailed information about a specific dangerous pattern
 * @param {string} patternName - Name of the pattern
 * @returns {Object|null} Pattern information or null if not found
 */
export function getPatternInfo(patternName) {
  const pattern = DANGEROUS_PATTERNS[patternName];
  if (!pattern) {
    return null;
  }

  return {
    name: patternName,
    description: pattern.description,
    riskLevel: pattern.riskLevel,
    examples: pattern.examples || [],
    mitigation: pattern.mitigation || "Block input containing this pattern",
  };
}

/**
 * Get all available dangerous patterns (for testing/debugging)
 * @returns {Array<string>} Array of pattern names
 */
export function getAllPatternNames() {
  return Object.keys(DANGEROUS_PATTERNS);
}

/**
 * Test input against a specific pattern
 * @param {string} input - Input to test
 * @param {string} patternName - Name of pattern to test against
 * @returns {boolean} True if pattern matches
 */
export function testAgainstPattern(input, patternName) {
  const pattern = DANGEROUS_PATTERNS[patternName];
  if (!pattern || typeof input !== "string") {
    return false;
  }

  return pattern.regex.test(input);
}
