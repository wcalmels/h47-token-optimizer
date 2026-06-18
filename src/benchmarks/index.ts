#!/usr/bin/env node

/**
 * H47 Token Optimizer — Performance Benchmarks
 */

import { runBenchmarkSuite, parseBenchmarkArgs } from './suite';
import { writeReportCsv, writeReportJson } from './export';
import { BenchmarkReport } from './types';
import { BenchmarkRow, BatchBenchmarkRow } from './runner';

async function main(): Promise<void> {
  const args = parseBenchmarkArgs(process.argv.slice(2));
  const {
    jsonOutput,
    csvOutput,
    csvPath,
    jsonPath,
    quickMode,
    iterations,
    saveBaseline,
    baselinePath,
    quiet,
  } = args;

  if (!jsonOutput && !quiet) {
    console.log('\n' + '═'.repeat(72));
    console.log('  H47 TOKEN OPTIMIZER — PERFORMANCE BENCHMARKS');
    console.log('═'.repeat(72));
    console.log(
      `  Node ${process.version}  |  Iterations: ${iterations}  |  Mode: ${quickMode ? 'quick' : 'full'}`
    );
    console.log('═'.repeat(72) + '\n');
  }

  const report = await runBenchmarkSuite({ iterations, quick: quickMode, silent: quiet });

  if (saveBaseline) {
    writeReportJson(report, baselinePath);
    if (!quiet && !jsonOutput) {
      console.log(`\n  ✓ Baseline saved to ${baselinePath}\n`);
    } else if (quiet) {
      console.log(`✓ Baseline saved to ${baselinePath}`);
    }
  }

  if (csvOutput) {
    writeReportCsv(report, csvPath);
    if (!jsonOutput) {
      console.log(`  ✓ CSV exported to ${csvPath}`);
    }
  }

  if (jsonOutput) {
    if (jsonPath && jsonPath !== 'benchmarks/results.json') {
      writeReportJson(report, jsonPath);
    }
    if (!quiet) {
      console.log(JSON.stringify(report, null, 2));
    }
    return;
  }

  if (csvOutput && !jsonOutput) {
    writeReportJson(report, jsonPath);
    console.log(`  ✓ JSON exported to ${jsonPath}`);
  }

  printTable('SCENARIO BENCHMARKS', report.scenarios);
  printTable('COMPRESSION LEVELS (conversation)', report.compressionMatrix);
  printTable('TARGET AI ADAPTERS (code)', report.targetAIMatrix);
  printBatchTable(report.batch);
  printSummary(report);

  console.log('\n  Commands:');
  console.log('    npm run benchmark:csv          → export CSV + JSON');
  console.log('    npm run benchmark:compare      → compare vs baseline');
  console.log('    npm run benchmark:save-baseline → update baseline.json\n');
}

function printTable(title: string, rows: BenchmarkRow[]): void {
  console.log('\n' + '─'.repeat(72));
  console.log(`  ${title}`);
  console.log('─'.repeat(72));
  console.log(
    pad('Scenario', 28) +
      pad('In', 8) +
      pad('Out', 8) +
      pad('Compress', 10) +
      pad('Quality', 9) +
      pad('Avg ms', 9) +
      pad('P95 ms', 9)
  );
  console.log('─'.repeat(72));

  for (const row of rows) {
    console.log(
      pad(row.scenario, 28) +
        pad(String(row.inputTokens), 8) +
        pad(String(row.outputTokens), 8) +
        pad(`${row.compressionPct}%`, 10) +
        pad(`${(row.quality * 100).toFixed(1)}%`, 9) +
        pad(String(row.latency.avgMs), 9) +
        pad(String(row.latency.p95Ms), 9)
    );
  }
}

function printBatchTable(batch: BatchBenchmarkRow): void {
  console.log('\n' + '─'.repeat(72));
  console.log('  BATCH THROUGHPUT');
  console.log('─'.repeat(72));
  console.log(`  Batch size:          ${batch.batchSize} prompts`);
  console.log(`  Total input tokens:  ${batch.totalInputTokens}`);
  console.log(`  Total output tokens: ${batch.totalOutputTokens}`);
  console.log(`  Avg compression:     ${batch.avgCompressionPct}%`);
  console.log(`  Sequential:          ${batch.sequentialMs} ms`);
  console.log(`  Parallel:            ${batch.parallelMs} ms`);
  console.log(`  Parallel speedup:    ${batch.parallelSpeedup}x`);
}

function printSummary(report: BenchmarkReport): void {
  const { bestCompression, fastestScenario, highestQuality } = report.summary;

  console.log('\n' + '═'.repeat(72));
  console.log('  SUMMARY');
  console.log('═'.repeat(72));
  console.log(
    `  Best compression:  ${bestCompression.scenario} → ${bestCompression.compressionPct}% (${bestCompression.tokensSaved} tokens saved)`
  );
  console.log(
    `  Fastest scenario:  ${fastestScenario.scenario} → ${fastestScenario.latency.avgMs}ms avg (${fastestScenario.latency.opsPerSec} ops/s)`
  );
  console.log(
    `  Highest quality:   ${highestQuality.scenario} → ${(highestQuality.quality * 100).toFixed(1)}%`
  );
  console.log('═'.repeat(72));
}

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width);
}

main().catch((error) => {
  console.error('Benchmark failed:', error);
  process.exit(1);
});
