#!/usr/bin/env node

/**
 * Compare current benchmarks against a saved baseline
 *
 * Usage:
 *   npm run benchmark:compare
 *   npm run benchmark:compare -- --baseline=benchmarks/baseline.json
 *   npm run benchmark:compare -- --current=benchmarks/results.json  (offline compare)
 */

import * as fs from 'fs';
import { runBenchmarkSuite } from './suite';
import { loadReportJson, writeReportJson } from './export';
import { compareReports, printComparison, DEFAULT_THRESHOLDS } from './compare';
import { CompareThresholds } from './types';

const args = process.argv.slice(2);

function getArg(name: string, fallback: string): string {
  const flag = args.find((a) => a.startsWith(`--${name}=`));
  return flag?.split('=')[1] ?? fallback;
}

async function main(): Promise<void> {
  const baselinePath = getArg('baseline', 'benchmarks/baseline.json');
  const currentPath = getArg('current', '');
  const outputPath = getArg('output', 'benchmarks/comparison.json');
  const jsonOnly = args.includes('--json');
  const quickMode = !args.includes('--full');
  const strict = args.includes('--strict');

  const thresholds: CompareThresholds = {
    maxLatencyRegressionPct: parseFloat(getArg('max-latency', String(DEFAULT_THRESHOLDS.maxLatencyRegressionPct))),
    maxCompressionRegressionPct: parseFloat(
      getArg('max-compression', String(DEFAULT_THRESHOLDS.maxCompressionRegressionPct))
    ),
    maxQualityRegressionPct: parseFloat(getArg('max-quality', String(DEFAULT_THRESHOLDS.maxQualityRegressionPct))),
    failOnLatency: strict,
  };

  if (!fs.existsSync(baselinePath)) {
    console.error(`Baseline not found: ${baselinePath}`);
    console.error('Run: npm run benchmark:save-baseline');
    process.exit(1);
  }

  const baseline = loadReportJson(baselinePath);

  let current;
  if (currentPath && fs.existsSync(currentPath)) {
    if (!jsonOnly) console.log(`Loading current report from ${currentPath}...`);
    current = loadReportJson(currentPath);
  } else {
    if (!jsonOnly) {
      console.log('\nRunning current benchmark suite (quick mode)...');
    }
    current = await runBenchmarkSuite({
      iterations: quickMode ? 10 : 50,
      quick: quickMode,
      silent: true,
    });
    writeReportJson(current, 'benchmarks/results.json');
  }

  const result = compareReports(baseline, current, thresholds);

  const dir = outputPath.split('/').slice(0, -1).join('/');
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');

  if (jsonOnly) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printComparison(result);
    console.log(`  Comparison saved to ${outputPath}\n`);
  }

  if (!result.passed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Compare failed:', error);
  process.exit(1);
});
