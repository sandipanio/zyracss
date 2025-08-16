/**
 * Cache Performance Benchmark - Hot Path Optimization Testing
 * Measures the performance impact of cache key memoization
 */

/**
 * Benchmark cache key generation performance
 * @param {number} iterations - Number of test iterations
 * @returns {Object} Performance benchmark results
 */
export function benchmarkCacheKeyGeneration(iterations = 10000) {
  const { performance } = globalThis;
  const startTime = performance ? performance.now() : Date.now();

  // Test data - ONLY bracket syntax classes
  const testClassNames = [
    "bg-[#ef4444]",
    "text-[white]",
    "p-[1rem]",
    "rounded-[0.5rem]",
    "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
    "hover:bg-[#2563eb]",
    "focus:outline-[none]",
    "transition-[colors]",
    "flex",
    "items-[center]",
    "justify-[between]",
    "space-x-[1rem]",
    "w-[100%]",
    "h-[16rem]",
    "max-w-[28rem]",
    "mx-[auto]",
    "my-[2rem]",
    "border",
    "border-[#d1d5db]",
    "bg-[#f9fafb]",
    "text-[#111827]",
  ];

  const testOptions = [
    { minify: true, groupSelectors: true },
    { minify: false, groupSelectors: false },
    { minify: true, groupSelectors: false, includeComments: true },
    { scope: "component", important: true },
    {},
  ];

  const results = {
    parseKeys: { operations: 0, timeMs: 0 },
    generationKeys: { operations: 0, timeMs: 0 },
    ruleKeys: { operations: 0, timeMs: 0 },
    totalOperations: 0,
    totalTimeMs: 0,
    operationsPerSecond: 0,
  };

  console.log(
    `🚀 Starting cache key memoization benchmark (${iterations} iterations)...`
  );

  // Benchmark parse keys
  const parseStart = performance ? performance.now() : Date.now();
  for (let i = 0; i < iterations; i++) {
    const className = testClassNames[i % testClassNames.length];
    import("./keyMemoization.js").then(({ getMemoizedParseKey }) => {
      getMemoizedParseKey(className);
    });
    results.parseKeys.operations++;
  }
  results.parseKeys.timeMs =
    (performance ? performance.now() : Date.now()) - parseStart;

  // Benchmark generation keys
  const genStart = performance ? performance.now() : Date.now();
  for (let i = 0; i < iterations; i++) {
    const classArray = testClassNames.slice(0, (i % 5) + 1);
    const options = testOptions[i % testOptions.length];
    import("./keyMemoization.js").then(({ getMemoizedGenerationKey }) => {
      getMemoizedGenerationKey(classArray, options);
    });
    results.generationKeys.operations++;
  }
  results.generationKeys.timeMs =
    (performance ? performance.now() : Date.now()) - genStart;

  // Benchmark rule keys
  const ruleStart = performance ? performance.now() : Date.now();
  for (let i = 0; i < iterations; i++) {
    const selector = `.${testClassNames[i % testClassNames.length]}`;
    const declarations = {
      color: "red",
      "background-color": "#ffffff",
      padding: "1rem",
      margin: "0.5rem",
    };
    import("./keyMemoization.js").then(({ getMemoizedRuleKey }) => {
      getMemoizedRuleKey(selector, declarations);
    });
    results.ruleKeys.operations++;
  }
  results.ruleKeys.timeMs =
    (performance ? performance.now() : Date.now()) - ruleStart;

  // Calculate totals
  results.totalOperations =
    results.parseKeys.operations +
    results.generationKeys.operations +
    results.ruleKeys.operations;
  results.totalTimeMs =
    (performance ? performance.now() : Date.now()) - startTime;
  results.operationsPerSecond =
    results.totalOperations / (results.totalTimeMs / 1000);

  return results;
}

/**
 * Compare memoized vs non-memoized performance
 * @param {number} iterations - Number of test iterations
 * @returns {Object} Comparison results
 */
export async function compareMemoizationPerformance(iterations = 1000) {
  console.log("📊 Comparing memoized vs non-memoized cache key performance...");

  const testData = {
    classNames: [
      "bg-[#ef4444]",
      "text-[white]",
      "p-[1rem]",
      "rounded-[0.5rem]",
    ],
    classArrays: [
      ["bg-[#ef4444]", "text-[white]"],
      [
        "p-[1rem]",
        "rounded-[0.5rem]",
        "shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
      ],
      ["flex", "items-[center]", "justify-[between]"],
    ],
    options: [{ minify: true }, { minify: false, groupSelectors: true }, {}],
  };

  // Benchmark memoized version
  const memoizedStart = Date.now();
  const { getMemoizedGenerationKey } = await import("./keyMemoization.js");

  for (let i = 0; i < iterations; i++) {
    const classArray = testData.classArrays[i % testData.classArrays.length];
    const options = testData.options[i % testData.options.length];
    getMemoizedGenerationKey(classArray, options);
  }
  const memoizedTime = Date.now() - memoizedStart;

  // Benchmark non-memoized version (simulated)
  const nonMemoizedStart = Date.now();
  const { createHash } = await import("crypto");

  for (let i = 0; i < iterations; i++) {
    const classArray = testData.classArrays[i % testData.classArrays.length];
    const options = testData.options[i % testData.options.length];

    // Simulate old key generation
    const sortedClasses = [...classArray].sort();
    const optionsStr = JSON.stringify({
      minify: options.minify || false,
      groupSelectors: options.groupSelectors !== false,
      includeComments: options.includeComments || false,
    });
    const classesHash = createHash("md5")
      .update(sortedClasses.join("|"))
      .digest("hex");
    const optionsHash = createHash("md5")
      .update(optionsStr)
      .digest("hex")
      .substring(0, 8);
    const key = `gen:${classesHash}:${optionsHash}`;
  }
  const nonMemoizedTime = Date.now() - nonMemoizedStart;

  const improvement =
    ((nonMemoizedTime - memoizedTime) / nonMemoizedTime) * 100;

  return {
    memoizedTime,
    nonMemoizedTime,
    improvement: Math.max(0, improvement),
    speedupFactor: nonMemoizedTime / memoizedTime,
    iterationsPerSecond: {
      memoized: iterations / (memoizedTime / 1000),
      nonMemoized: iterations / (nonMemoizedTime / 1000),
    },
  };
}

/**
 * Run comprehensive cache performance tests
 * @returns {Object} Complete performance report
 */
export async function runCachePerformanceTests() {
  console.log("🔬 Running comprehensive cache performance tests...");

  try {
    // Basic benchmark
    console.log("1. Running basic key generation benchmark...");
    const basicBenchmark = benchmarkCacheKeyGeneration(5000);

    // Memoization comparison
    console.log("2. Running memoization comparison...");
    const memoizationComparison = await compareMemoizationPerformance(2000);

    // Get memoization stats
    console.log("3. Getting memoization statistics...");
    const { getKeyMemoizationStats } = await import("./keyMemoization.js");
    const memoStats = getKeyMemoizationStats();

    const report = {
      timestamp: new Date().toISOString(),
      basicBenchmark,
      memoizationComparison,
      memoizationStats: memoStats,
      summary: {
        totalOperationsTested:
          basicBenchmark.totalOperations +
          memoizationComparison.iterationsPerSecond.memoized,
        estimatedPerformanceGain: `${memoizationComparison.improvement.toFixed(2)}%`,
        recommendedOptimizations: [],
      },
    };

    // Add recommendations
    if (memoStats.overallHitRate < 0.7) {
      report.summary.recommendedOptimizations.push(
        "Increase key cache size for better hit rates"
      );
    }

    if (memoStats.cacheUtilization.accessFrequency > 50000) {
      report.summary.recommendedOptimizations.push(
        "Consider more frequent optimization cycles"
      );
    }

    if (memoizationComparison.improvement > 20) {
      report.summary.recommendedOptimizations.push(
        "Memoization is providing significant benefits"
      );
    }

    return report;
  } catch (error) {
    console.error("❌ Error running performance tests:", error);
    return {
      error: error.message,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Monitor cache performance in real-time
 * @param {number} intervalMs - Monitoring interval in milliseconds
 * @param {number} durationMs - Total monitoring duration
 * @returns {Promise} Monitoring results
 */
export async function monitorCachePerformance(
  intervalMs = 5000,
  durationMs = 30000
) {
  console.log(
    `📈 Monitoring cache performance for ${durationMs / 1000}s (${intervalMs / 1000}s intervals)...`
  );

  const measurements = [];
  const startTime = Date.now();

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      try {
        const { getKeyMemoizationStats } = await import("./keyMemoization.js");
        const stats = getKeyMemoizationStats();

        measurements.push({
          timestamp: Date.now() - startTime,
          ...stats,
          memoryUsage: stats.cacheUtilization
            ? Object.values(stats.cacheUtilization).reduce((a, b) => a + b, 0)
            : 0,
        });

        console.log(
          `📊 Cache Hit Rate: ${(stats.overallHitRate * 100).toFixed(1)}%, Memory: ${measurements[measurements.length - 1].memoryUsage} entries`
        );

        if (Date.now() - startTime >= durationMs) {
          clearInterval(interval);
          resolve({
            measurements,
            summary: {
              averageHitRate:
                measurements.reduce((sum, m) => sum + m.overallHitRate, 0) /
                measurements.length,
              maxMemoryUsage: Math.max(
                ...measurements.map((m) => m.memoryUsage)
              ),
              totalOperations:
                measurements[measurements.length - 1].totalOperations || 0,
            },
          });
        }
      } catch (error) {
        console.error("❌ Monitoring error:", error);
        clearInterval(interval);
        resolve({ error: error.message });
      }
    }, intervalMs);
  });
}
