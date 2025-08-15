/**
 * Build command for ZyraCSS CLI
 * Processes files and generates CSS using the core API
 */

import fs from "fs/promises";
import path from "path";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";
import { glob } from "glob";
import { generateCSS } from "../../src/api/generateCSS.js";
import { now } from "../../src/core/utils/index.js";
import { getVersion } from "../../src/core/utils/version.js";

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
    if (result.invalid && result.invalid.length > 0) {
      console.warn(
        `⚠️  Warning: ${result.invalid.length} invalid class(es) found:`
      );
      result.invalid.forEach((invalid) => {
        if (typeof invalid === "object" && invalid.original) {
          console.warn(`   ${invalid.original} - ${invalid.reason}`);
        } else {
          console.warn(`   ${invalid}`);
        }
      });
    }

    if (!result.css || result.css.trim().length === 0) {
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
    let finalCSS = result.css;
    if (!options.minify && finalCSS) {
      const timestamp = new Date().toISOString();
      const version = getVersion();
      const header = `/*
 * Generated by ZyraCSS v${version}
 * Generated at: ${timestamp}
 * Input files: ${inputFiles.length}
 * Valid classes: ${result.stats.validClasses}
 * Generated rules: ${result.stats.generatedRules}
 * Compression ratio: ${(result.stats.compressionRatio * 100).toFixed(1)}%
 */

`;
      finalCSS = header + finalCSS;
    }

    await fs.writeFile(outputPath, finalCSS, "utf-8");

    // Step 7: Success output
    const totalTime = now() - startTime;
    const relativePath = path.relative(process.cwd(), outputPath);

    console.log("✅ CSS generated successfully!");
    console.log(`📄 Output: ${relativePath}`);
    console.log(
      `📊 Stats: ${result.stats.validClasses} classes → ${result.stats.generatedRules} rules`
    );
    console.log(`⚡ Performance: ${Math.round(totalTime)}ms`);

    if (options.verbose && result.stats.compressionRatio < 1) {
      console.log(
        `🗜️  Compression: ${(result.stats.compressionRatio * 100).toFixed(1)}% (${result.stats.groupedRules} grouped rules)`
      );
    }

    // Step 8: File size information
    const stats = await fs.stat(outputPath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`📏 File size: ${sizeKB} KB`);
  } catch (error) {
    console.error("❌ Build failed:", error.message);

    if (options.verbose) {
      console.error("📋 Stack trace:", error.stack);
    }

    process.exit(1);
  }
}
