/**
 * Dangerous pattern detection for security with safe regex execution
 * Identifies and blocks malicious content patterns using timeout protection
 */

import { DANGEROUS_PATTERNS } from "./securityConstants.js";
import { syncSafeRegexTest, REGEX_TIMEOUTS } from "./safeRegex.js";

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

  // Check against all dangerous patterns with safe regex execution
  for (const [patternName, patternInfo] of Object.entries(DANGEROUS_PATTERNS)) {
    const testResult = syncSafeRegexTest(patternInfo.regex, input, {
      timeout: REGEX_TIMEOUTS.NORMAL,
      maxLength: 50000,
    });

    if (testResult.error) {
      // Log regex error but continue processing
      console.warn(`Regex error for pattern ${patternName}:`, testResult.error);
      continue;
    }

    if (testResult.timedOut) {
      // Treat timeout as potential danger
      matchedPatterns.push({
        name: patternName,
        description: `${patternInfo.description} (timeout detected)`,
        riskLevel: "critical",
        match: "TIMEOUT_DETECTED",
        timedOut: true,
      });
      highestRiskLevel = "critical";
      continue;
    }

    if (testResult.result) {
      // Safe match operation
      const matchResult = input.match(patternInfo.regex);
      matchedPatterns.push({
        name: patternName,
        description: patternInfo.description,
        riskLevel: patternInfo.riskLevel,
        match: matchResult?.[0],
        executionTime: testResult.duration,
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
    const testResult = syncSafeRegexTest(pattern.regex, input, {
      timeout: REGEX_TIMEOUTS.FAST,
      maxLength: 10000,
    });

    if (testResult.error || testResult.timedOut) {
      // Any error or timeout for high-priority patterns means unsafe
      return false;
    }

    if (testResult.result) {
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
 * Test input against a specific pattern with safe execution
 * @param {string} input - Input to test
 * @param {string} patternName - Name of pattern to test against
 * @returns {boolean} True if pattern matches
 */
export function testAgainstPattern(input, patternName) {
  const pattern = DANGEROUS_PATTERNS[patternName];
  if (!pattern || typeof input !== "string") {
    return false;
  }

  const testResult = syncSafeRegexTest(pattern.regex, input, {
    timeout: REGEX_TIMEOUTS.NORMAL,
    maxLength: 10000,
  });

  // Return false for errors, timeouts, or no matches
  return (
    testResult.result === true && !testResult.error && !testResult.timedOut
  );
}
