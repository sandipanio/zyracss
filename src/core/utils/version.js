import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packagePath = join(__dirname, "../../../package.json");

let packageInfo = null;

function loadPackageInfo() {
  if (!packageInfo) {
    try {
      const packageContent = readFileSync(packagePath, "utf-8");
      packageInfo = JSON.parse(packageContent);
    } catch (error) {
      packageInfo = { version: "0.1.0", name: "zyracss" };
    }
  }
  return packageInfo;
}

export function getVersion() {
  return loadPackageInfo().version;
}

export function getVersionInfo() {
  const pkg = loadPackageInfo();
  const [major, minor, patch] = pkg.version.split(".").map(Number);

  return {
    version: pkg.version,
    major,
    minor,
    patch,
    name: pkg.name,
    FULL: pkg.version,
  };
}
