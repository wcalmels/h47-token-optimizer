/**
 * Benchmark report types
 */

import { BatchBenchmarkRow, BenchmarkRow } from './runner';

export interface BenchmarkReport {
  version: string;
  timestamp: string;
  nodeVersion: string;
  config: { iterations: number; quick: boolean };
  scenarios: BenchmarkRow[];
  compressionMatrix: BenchmarkRow[];
  targetAIMatrix: BenchmarkRow[];
  batch: BatchBenchmarkRow;
  summary: {
    bestCompression: BenchmarkRow;
    fastestScenario: BenchmarkRow;
    highestQuality: BenchmarkRow;
  };
}

export interface BenchmarkOptions {
  iterations: number;
  quick: boolean;
  silent?: boolean;
}

export interface CompareThresholds {
  maxLatencyRegressionPct: number;
  maxCompressionRegressionPct: number;
  maxQualityRegressionPct: number;
  failOnLatency?: boolean;
}

export interface ComparisonMetric {
  scenario: string;
  section: string;
  field: string;
  baseline: number;
  current: number;
  delta: number;
  deltaPct: number;
  status: 'ok' | 'regression' | 'improvement';
}

export interface ComparisonResult {
  baselineVersion: string;
  currentVersion: string;
  baselineTimestamp: string;
  currentTimestamp: string;
  metrics: ComparisonMetric[];
  regressions: ComparisonMetric[];
  improvements: ComparisonMetric[];
  passed: boolean;
}
