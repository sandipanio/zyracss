/**
 * Security constants and configuration
 * Centralized security rules and patterns
 */

// Length limits
export const MAX_CLASS_LENGTH = 500;
export const MAX_VALUE_LENGTH = 200;
export const MAX_CLASSES_PER_REQUEST = 10000;

// Dangerous CSS patterns with detailed information
export const DANGEROUS_PATTERNS = {
  javascript_url: {
    regex: /javascript:/i,
    description: "JavaScript URL scheme that can execute code",
    riskLevel: "critical",
    examples: ["javascript:alert(1)", "JAVASCRIPT:void(0)"],
  },

  data_url: {
    regex: /data:/i,
    description: "Data URL scheme that can contain executable content",
    riskLevel: "high",
    examples: ["data:text/html,<script>alert(1)</script>"],
  },

  css_expression: {
    regex: /expression\s*\(/i,
    description: "CSS expressions (IE-specific) that can execute JavaScript",
    riskLevel: "critical",
    examples: ["expression(alert(1))", "expression(document.cookie)"],
  },

  css_behavior: {
    regex: /behavior\s*:/i,
    description: "CSS behavior property that can load external scripts",
    riskLevel: "high",
    examples: ["behavior: url(evil.htc)"],
  },

  css_binding: {
    regex: /binding\s*:/i,
    description:
      "CSS binding property (Mozilla-specific) that can execute code",
    riskLevel: "high",
    examples: ["binding: url(xbl.xml#myBinding)"],
  },

  css_import: {
    regex: /@import/i,
    description: "CSS import that can load external stylesheets",
    riskLevel: "medium",
    examples: ["@import url(evil.css)", '@import "malicious.css"'],
  },

  css_comment: {
    regex: /\/\*[\s\S]*?\*\//g,
    description: "CSS comments that might hide malicious content",
    riskLevel: "low",
    examples: ["/* hidden content */", "/**/evil/**/"],
  },

  html_script: {
    regex: /<script/i,
    description: "HTML script tags that execute JavaScript",
    riskLevel: "critical",
    examples: ["<script>alert(1)</script>", "<SCRIPT src=evil.js>"],
  },

  html_iframe: {
    regex: /<iframe/i,
    description: "HTML iframe tags that can load external content",
    riskLevel: "high",
    examples: ['<iframe src="evil.html">', "<IFRAME onload=alert(1)>"],
  },

  event_handler: {
    regex: /on\w+\s*=/i,
    description: "HTML event handlers that can execute JavaScript",
    riskLevel: "critical",
    examples: ["onclick=alert(1)", 'onload="evil()"', "onerror=hack()"],
  },

  url_scheme: {
    regex: /\b(?:file|ftp|mailto|tel):/i,
    description: "Non-HTTP URL schemes that might be dangerous",
    riskLevel: "medium",
    examples: ["file:///etc/passwd", "ftp://evil.com"],
  },

  css_calc_injection: {
    regex: /calc\s*\([^)]*(?:expression|javascript|eval)/i,
    description: "CSS calc() function with potential code injection",
    riskLevel: "high",
    examples: ["calc(expression(alert(1)))", "calc(javascript:void(0))"],
  },
};

// Safe CSS function patterns (whitelist)
export const SAFE_CSS_FUNCTIONS = [
  "rgb",
  "rgba",
  "hsl",
  "hsla",
  "linear-gradient",
  "radial-gradient",
  "conic-gradient",
  "calc",
  "min",
  "max",
  "clamp",
  "var",
  "env",
  "url", // Only with safe protocols
  "rotate",
  "scale",
  "translate",
  "skew",
  "matrix",
  "matrix3d",
  "perspective",
  "cubic-bezier",
  "steps",
  "blur",
  "brightness",
  "contrast",
  "grayscale",
  "hue-rotate",
  "invert",
  "opacity",
  "saturate",
  "sepia",
];

// Security levels
export const SECURITY_LEVELS = {
  STRICT: "strict", // Block anything suspicious
  NORMAL: "normal", // Block known dangerous patterns
  LENIENT: "lenient", // Only block critical threats
};

// Default security configuration
export const DEFAULT_SECURITY_CONFIG = {
  level: SECURITY_LEVELS.NORMAL,
  maxClassLength: MAX_CLASS_LENGTH,
  maxValueLength: MAX_VALUE_LENGTH,
  maxClassesPerRequest: MAX_CLASSES_PER_REQUEST,
  blockComments: true,
  blockDataUrls: true,
  blockJavaScriptUrls: true,
  allowedFunctions: SAFE_CSS_FUNCTIONS,
};

// Rate limiting constants
export const RATE_LIMITS = {
  requestsPerMinute: 1000,
  classesPerMinute: 50000,
  maxBurstSize: 100,
};

// Error messages
export const SECURITY_ERRORS = {
  DANGEROUS_PATTERN: "Input contains dangerous patterns",
  INPUT_TOO_LONG: "Input exceeds maximum length",
  TOO_MANY_CLASSES: "Too many classes in request",
  INVALID_FUNCTION: "CSS function not allowed",
  SUSPICIOUS_CONTENT: "Content appears suspicious",
  RATE_LIMITED: "Rate limit exceeded",
};
