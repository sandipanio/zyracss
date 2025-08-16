/**
 * Lightweight utils exports for API layer
 * Re-exports only essential utilities to minimize bundle size
 */

export { createTimer, now, createLogger } from "./index.js";

// Note: This allows importing just timing and logging utilities
// without pulling in CSS utilities, string processing, and other non-API functions
