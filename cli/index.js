import { Command } from "commander";
import buildCommand from "./commands/build.js";
import { getVersion } from "../src/core/utils/version.js";

const version = getVersion();

// Create a new instance of Commander CLI
const program = new Command();

// Core CLI metadata
program
  .name("zyracss")
  .description(
    "ZyraCSS: A utility-first CSS generator that supports arbitrary values"
  )
  .version(version); // Version should match package.json

// Register commands modularly
// All commands live in separate files to keep CLI modular and maintainable
program
  .command("build")
  .description("Generate CSS from HTML or JSON input")
  .option("-i, --input <path>", "Input file path (HTML or JSON)")
  .option("-o, --output <path>", "Output CSS file path")
  .option("--json", "Force JSON parsing mode")
  .action(buildCommand);

// TODO: Add `watch`, `init`, and other subcommands here using the same pattern

// Parse command-line arguments
// No need to pass process.argv in Commander v14+
program.parse();
