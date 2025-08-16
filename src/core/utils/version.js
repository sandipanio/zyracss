/**
 * Version utilities with fallback for async environments
 */

let packageInfo = null;
let loadingPromise = null;

// Synchronous fallback version info
const FALLBACK_VERSION = {
  version: "0.1.0",
  major: 0,
  minor: 1,
  patch: 0,
  name: "zyracss",
  FULL: "0.1.0",
};

async function loadPackageInfoAsync() {
  if (packageInfo) return packageInfo;

  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      // Use dynamic import to avoid blocking module initialization
      const { readFileSync } = await import("fs");
      const { join, dirname } = await import("path");
      const { fileURLToPath } = await import("url");

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const packagePath = join(__dirname, "../../../package.json");

      const packageContent = readFileSync(packagePath, "utf-8");
      packageInfo = JSON.parse(packageContent);
      return packageInfo;
    } catch (error) {
      console.warn(
        "Failed to load package.json, using fallback version:",
        error.message
      );
      packageInfo = FALLBACK_VERSION;
      return packageInfo;
    } finally {
      loadingPromise = null;
    }
  })();

  return loadingPromise;
}

function loadPackageInfo() {
  if (packageInfo) return packageInfo;

  try {
    // Synchronous loading for immediate use
    const { readFileSync } = require("fs");
    const { join, dirname } = require("path");
    const { fileURLToPath } = require("url");

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packagePath = join(__dirname, "../../../package.json");

    const packageContent = readFileSync(packagePath, "utf-8");
    packageInfo = JSON.parse(packageContent);
    return packageInfo;
  } catch (error) {
    console.warn("Failed to load package.json synchronously, using fallback");
    packageInfo = FALLBACK_VERSION;
    return packageInfo;
  }
}

export function getVersion() {
  return loadPackageInfo().version;
}

export function getVersionInfo() {
  const pkg = loadPackageInfo();
  const [major, minor, patch] = pkg.version.split(".").map(Number);

  return {
    version: pkg.version,
    major: major || 0,
    minor: minor || 1,
    patch: patch || 0,
    name: pkg.name,
    FULL: pkg.version,
  };
}

export async function getVersionInfoAsync() {
  const pkg = await loadPackageInfoAsync();
  const [major, minor, patch] = pkg.version.split(".").map(Number);

  return {
    version: pkg.version,
    major: major || 0,
    minor: minor || 1,
    patch: patch || 0,
    name: pkg.name,
    FULL: pkg.version,
  };
}
