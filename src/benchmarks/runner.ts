/**
 * Benchmark runner — measures latency, throughput, compression and quality
 */

import { H47TokenOptimizer, OptimizationOptions, OptimizationResult } from '../core/tokenOptimizer';
import { estimateTokens } from '../core/tokenUtils';

export interface TimingStats {
  runs: number;
  avgMs: number;
  minMs: number;
  maxMs: number;
  p50Ms: number;
  p95Ms: number;
  opsPerSec: number;
}

export interface BenchmarkRow {
  scenario: string;
  category: string;
  targetAI: string;
  compressionLevel: string;
  inputTokens: number;
  outputTokens: number;
  compressionPct: number;
  quality: number;
  tokensSaved: number;
  latency: TimingStats;
}

export interface BatchBenchmarkRow {
  scenario: string;
  batchSize: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgCompressionPct: number;
  sequentialMs: number;
  parallelMs: number;
  parallelSpeedup: number;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

export function measureTiming(durationsMs: number[]): TimingStats {
  const sorted = [...durationsMs].sort((a, b) => a - b);
  const total = sorted.reduce((sum, value) => sum + value, 0);
  const avgMs = total / sorted.length;

  return {
    runs: sorted.length,
    avgMs: round(avgMs),
    minMs: round(sorted[0] ?? 0),
    maxMs: round(sorted[sorted.length - 1] ?? 0),
    p50Ms: round(percentile(sorted, 50)),
    p95Ms: round(percentile(sorted, 95)),
    opsPerSec: round(1000 / avgMs, 1),
  };
}

export async function runScenarioBenchmark(
  optimizer: H47TokenOptimizer,
  scenario: string,
  category: string,
  text: string,
  options: OptimizationOptions,
  iterations = 50
): Promise<BenchmarkRow> {
  const durations: number[] = [];
  let lastResult: OptimizationResult | null = null;

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    lastResult = await optimizer.optimize(text, options);
    durations.push(performance.now() - start);
  }

  if (!lastResult) {
    throw new Error(`Benchmark failed for scenario: ${scenario}`);
  }

  return {
    scenario,
    category,
    targetAI: options.targetAI ?? 'generic',
    compressionLevel: options.compressionLevel ?? 'balanced',
    inputTokens: lastResult.original.tokenCount,
    outputTokens: lastResult.optimized.tokenCount,
    compressionPct: lastResult.metrics.compression,
    quality: lastResult.metrics.quality,
    tokensSaved: lastResult.metrics.savings,
    latency: measureTiming(durations),
  };
}

export async function runCompressionMatrix(
  optimizer: H47TokenOptimizer,
  scenario: string,
  category: string,
  text: string,
  targetAI: OptimizationOptions['targetAI'] = 'generic',
  iterations = 30
): Promise<BenchmarkRow[]> {
  const levels: OptimizationOptions['compressionLevel'][] = [
    'conservative',
    'balanced',
    'aggressive',
  ];

  const rows: BenchmarkRow[] = [];
  for (const level of levels) {
    rows.push(
      await runScenarioBenchmark(
        optimizer,
        `${scenario} (${level})`,
        category,
        text,
        { targetAI, compressionLevel: level },
        iterations
      )
    );
  }
  return rows;
}

export async function runTargetAIMatrix(
  optimizer: H47TokenOptimizer,
  text: string,
  iterations = 30
): Promise<BenchmarkRow[]> {
  const targets: OptimizationOptions['targetAI'][] = ['claude', 'gpt', 'cursor', 'generic'];
  const rows: BenchmarkRow[] = [];

  for (const targetAI of targets) {
    rows.push(
      await runScenarioBenchmark(
        optimizer,
        `Multi-AI adapter (${targetAI})`,
        'adapter',
        text,
        { targetAI, compressionLevel: 'balanced' },
        iterations
      )
    );
  }
  return rows;
}

export async function runBatchBenchmark(
  optimizer: H47TokenOptimizer,
  texts: string[],
  options: OptimizationOptions = { compressionLevel: 'balanced' }
): Promise<BatchBenchmarkRow> {
  const seqStart = performance.now();
  const sequential = await optimizer.optimizeBatch(texts, options);
  const sequentialMs = performance.now() - seqStart;

  const parStart = performance.now();
  await Promise.all(texts.map((text) => optimizer.optimize(text, options)));
  const parallelMs = performance.now() - parStart;

  const totalInputTokens = sequential.reduce((sum, r) => sum + r.original.tokenCount, 0);
  const totalOutputTokens = sequential.reduce((sum, r) => sum + r.optimized.tokenCount, 0);
  const avgCompressionPct =
    sequential.reduce((sum, r) => sum + r.metrics.compression, 0) / sequential.length;

  return {
    scenario: 'Batch processing',
    batchSize: texts.length,
    totalInputTokens,
    totalOutputTokens,
    avgCompressionPct: round(avgCompressionPct),
    sequentialMs: round(sequentialMs),
    parallelMs: round(parallelMs),
    parallelSpeedup: round(sequentialMs / parallelMs, 2),
  };
}

export function estimateFixtureTokens(text: string): number {
  return estimateTokens(text);
}

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}
