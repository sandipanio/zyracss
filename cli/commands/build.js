/**
 * Build command for ZyraCSS CLI
 * Processes files and generates CSS using the core API
 */

import fs from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { glob } from "glob";
import { generateCSS } from "../../src/api/core/generateCSS.js";
import { now } from "../../src/core/utils/index.js";
import { getVersion } from "../../src/core/utils/version.js";
import { cleanupGlobalCache } from "../../src/core/cache/index.js";

/**
 * Enhanced build command handler for `zyracss build`
 * Uses the real ZyraCSS core engine
 *
 * @param {Object} options - Commander options parsed from CLI
 * @param {string} options.input - Path to input file(s) or glob pattern
 * @param {string} options.output - Path to output CSS file (optional)
 * @param {boolean} options.json - Whether to force JSON mode
 * @param {boolean} options.minify - Whether to minify output CSS
 * @param {boolean} options.watch - Whether to enable watch mode
 * @param {boolean} options.verbose - Whether to show detailed output
 */
export default async function buildCommand(options) {
  const startTime = now();

  try {
    // Step 1: Validate and resolve input paths
    if (!options.input) {
      console.error(
        "❌ Error: Input file or pattern is required. Use -i or --input to specify."
      );
      process.exit(1);
    }

    if (options.verbose) {
      console.log("🔍 Scanning for files...");
    }

    // Step 2: Find all matching files using glob
    const inputPattern = path.resolve(process.cwd(), options.input);
    let inputFiles = [];

    if (inputPattern.includes("*") || inputPattern.includes("?")) {
      // Glob pattern
      inputFiles = await glob(inputPattern, {
        ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
        absolute: true,
      });
    } else {
      // Single file
      if (!existsSync(inputPattern)) {
        console.error(`❌ Error: Input file "${inputPattern}" does not exist.`);
        process.exit(1);
      }
      inputFiles = [inputPattern];
    }

    if (inputFiles.length === 0) {
      console.error(
        `❌ Error: No files found matching pattern "${options.input}"`
      );
      process.exit(1);
    }

    if (options.verbose) {
      console.log(`📁 Found ${inputFiles.length} file(s) to process:`);
      inputFiles.forEach((file) =>
        console.log(`   ${path.relative(process.cwd(), file)}`)
      );
    }

    // Step 3: Process files and extract content
    const htmlContent = [];
    const jsonClasses = [];

    for (const filePath of inputFiles) {
      const content = await fs.readFile(filePath, "utf-8");
      const ext = path.extname(filePath).toLowerCase();

      // Determine processing mode
      const isJSONMode = options.json || ext === ".json";

      if (isJSONMode) {
        // Parse JSON array of classes
        try {
          const parsed = JSON.parse(content);
          if (Array.isArray(parsed)) {
            jsonClasses.push(...parsed);
          } else {
            console.warn(
              `⚠️  Warning: JSON file ${filePath} does not contain an array of classes`
            );
          }
        } catch (error) {
          console.warn(
            `⚠️  Warning: Failed to parse JSON file ${filePath}: ${error.message}`
          );
        }
      } else {
        // HTML/JSX/TSX content
        htmlContent.push(content);
      }
    }

    if (options.verbose) {
      console.log("⚙️  Generating CSS...");
    }

    // Step 4: Generate CSS using ZyraCSS core
    const result = await generateCSS({
      html: htmlContent,
      classes: jsonClasses,
      options: {
        minify: options.minify || false,
        groupSelectors: true,
        includeComments: !options.minify,
      },
    });

    // Step 5: Handle generation results
    if (!result.success) {
      console.error(
        "❌ Generation failed:",
        result.error?.message || "Unknown error"
      );
      process.exit(1);
    }

    const generatedData = result.data;

    if (generatedData.invalid && generatedData.invalid.length > 0) {
      console.warn(
        `⚠️  Warning: ${generatedData.invalid.length} invalid class(es) found:`
      );
      generatedData.invalid.forEach((invalid) => {
        if (typeof invalid === "object" && invalid.className) {
          // Handle the new error object structure
          const className = invalid.className;
          const errorMsg =
            invalid.error?.message || invalid.reason || "Unknown error";
          const suggestions =
            invalid.suggestions && invalid.suggestions.length > 0
              ? ` (${invalid.suggestions.join(", ")})`
              : "";
          console.warn(`   ${className} - ${errorMsg}${suggestions}`);
        } else if (typeof invalid === "object" && invalid.original) {
          console.warn(`   ${invalid.original} - ${invalid.reason}`);
        } else if (typeof invalid === "string") {
          console.warn(`   ${invalid}`);
        } else {
          // Fallback for any other object structure
          console.warn(`   ${JSON.stringify(invalid)}`);
        }
      });
    }

    if (!generatedData.css || generatedData.css.trim().length === 0) {
      console.warn(
        "⚠️  Warning: No valid utility classes found. Generated CSS is empty."
      );
    }

    // Step 6: Write output file
    const outputPath = options.output
      ? path.resolve(process.cwd(), options.output)
      : path.resolve(process.cwd(), "dist/zyracss.css");

    // Ensure output directory exists
    mkdirSync(dirname(outputPath), { recursive: true });

    // Add generation metadata as comment (unless minified)
    let finalCSS = generatedData.css || "";
    if (!options.minify && finalCSS) {
      const timestamp = new Date().toISOString();
      const version = getVersion();
      const stats = generatedData.stats || {};
      const header = `/*
 * Generated by ZyraCSS v${version}
 * Generated at: ${timestamp}
 * Input files: ${inputFiles.length}
 * Valid classes: ${stats.validClasses || 0}
 * Generated rules: ${stats.generatedRules || 0}
 * Compression ratio: ${((stats.compressionRatio || 0) * 100).toFixed(1)}%
 */

`;
      finalCSS = header + finalCSS;
    }

    await fs.writeFile(outputPath, finalCSS, "utf-8");

    // Step 7: Success output
    const totalTime = now() - startTime;
    const relativePath = path.relative(process.cwd(), outputPath);
    const resultStats = generatedData.stats || {};

    console.log("✅ CSS generated successfully!");
    console.log(`📄 Output: ${relativePath}`);
    console.log(
      `📊 Stats: ${resultStats.validClasses || 0} classes → ${resultStats.generatedRules || 0} rules`
    );
    console.log(`⚡ Performance: ${Math.round(totalTime)}ms`);

    if (options.verbose && (resultStats.compressionRatio || 0) < 1) {
      console.log(
        `🗜️  Compression: ${((resultStats.compressionRatio || 0) * 100).toFixed(1)}% (${resultStats.groupedRules || 0} grouped rules)`
      );
    }

    // Step 8: File size information
    const fileStats = await fs.stat(outputPath);
    const sizeKB = (fileStats.size / 1024).toFixed(1);
    console.log(`📏 File size: ${sizeKB} KB`);

    // Cleanup and force exit after a brief delay
    cleanupGlobalCache();

    // Force exit after 100ms to ensure output is flushed
    setTimeout(() => {
      process.exit(0);
    }, 100);
  } catch (error) {
    console.error("❌ Build failed:", error.message);

    if (options.verbose) {
      console.error("📋 Stack trace:", error.stack);
    }

    // Cleanup before exit
    cleanupGlobalCache();

    // Force exit on error after brief delay
    setTimeout(() => {
      process.exit(1);
    }, 100);
  }
}
