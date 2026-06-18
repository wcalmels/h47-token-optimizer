/**
 * Runs the full benchmark suite and produces a report
 */

import { H47TokenOptimizer } from '../core/tokenOptimizer';
import { FIXTURES, buildConversationPrompt, buildCodeAnalysisPrompt } from './fixtures';
import {
  runScenarioBenchmark,
  runCompressionMatrix,
  runTargetAIMatrix,
  runBatchBenchmark,
  BenchmarkRow,
} from './runner';
import { BenchmarkOptions, BenchmarkReport } from './types';

export async function runBenchmarkSuite(options: BenchmarkOptions): Promise<BenchmarkReport> {
  const { iterations, quick, silent = false } = options;
  const optimizer = new H47TokenOptimizer();
  const stats = optimizer.getStats();

  const log = (message: string) => {
    if (!silent) process.stdout.write(message);
  };

  const scenarios: BenchmarkRow[] = [];
  for (const fixture of FIXTURES) {
    log(`  ▶ ${fixture.name}...`);
    const row = await runScenarioBenchmark(
      optimizer,
      fixture.name,
      fixture.category,
      fixture.text,
      fixture.defaultOptions ?? {},
      iterations
    );
    scenarios.push(row);
    if (!silent) {
      console.log(` ${row.compressionPct}% compression, ${row.latency.avgMs}ms avg`);
    }
  }

  if (!silent) console.log('\n  Compression level matrix (conversation)...');
  const compressionMatrix = await runCompressionMatrix(
    optimizer,
    'Conversation',
    'matrix',
    buildConversationPrompt(quick ? 30 : 100),
    'generic',
    Math.max(10, Math.floor(iterations / 2))
  );

  if (!silent) console.log('  Target AI matrix...');
  const targetAIMatrix = await runTargetAIMatrix(
    optimizer,
    buildCodeAnalysisPrompt(quick ? 50 : 200),
    Math.max(10, Math.floor(iterations / 2))
  );

  if (!silent) console.log('  Batch throughput...');
  const batchTexts = FIXTURES.slice(0, 3).map((f) => f.text);
  const batch = await runBatchBenchmark(optimizer, batchTexts);

  const bestCompression = [...scenarios].sort((a, b) => b.compressionPct - a.compressionPct)[0];
  const fastestScenario = [...scenarios].sort((a, b) => a.latency.avgMs - b.latency.avgMs)[0];
  const highestQuality = [...scenarios].sort((a, b) => b.quality - a.quality)[0];

  return {
    version: stats.version,
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    config: { iterations, quick },
    scenarios,
    compressionMatrix,
    targetAIMatrix,
    batch,
    summary: { bestCompression, fastestScenario, highestQuality },
  };
}

export function parseBenchmarkArgs(args: string[]): {
  jsonOutput: boolean;
  csvOutput: boolean;
  csvPath: string;
  jsonPath: string;
  quickMode: boolean;
  iterations: number;
  saveBaseline: boolean;
  baselinePath: string;
  quiet: boolean;
} {
  const quickMode = args.includes('--quick');
  const iterationsFlag = args.find((a) => a.startsWith('--iterations='));
  const csvFlag = args.find((a) => a.startsWith('--csv='));
  const jsonFlag = args.find((a) => a.startsWith('--json='));
  const baselineFlag = args.find((a) => a.startsWith('--baseline='));

  return {
    jsonOutput: args.includes('--json') || Boolean(jsonFlag),
    csvOutput: args.includes('--csv') || Boolean(csvFlag),
    csvPath: csvFlag?.split('=')[1] ?? 'benchmarks/results.csv',
    jsonPath: jsonFlag?.split('=')[1] ?? 'benchmarks/results.json',
    quickMode,
    iterations: iterationsFlag
      ? parseInt(iterationsFlag.split('=')[1], 10)
      : quickMode
        ? 10
        : 50,
    saveBaseline: args.includes('--save-baseline'),
    baselinePath: baselineFlag?.split('=')[1] ?? 'benchmarks/baseline.json',
    quiet: args.includes('--quiet'),
  };
}
