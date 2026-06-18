import { describe, it, expect } from 'vitest';
import { reportToCsv, loadReportJson, writeReportJson } from '../src/benchmarks/export';
import { compareReports, DEFAULT_THRESHOLDS } from '../src/benchmarks/compare';
import { BenchmarkReport } from '../src/benchmarks/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const mockRow = (scenario: string, compressionPct: number, avgMs: number, quality = 0.95) => ({
  scenario,
  category: 'test',
  targetAI: 'generic',
  compressionLevel: 'balanced',
  inputTokens: 1000,
  outputTokens: 200,
  compressionPct,
  quality,
  tokensSaved: 800,
  latency: {
    runs: 10,
    avgMs,
    minMs: avgMs - 1,
    maxMs: avgMs + 1,
    p50Ms: avgMs,
    p95Ms: avgMs + 2,
    opsPerSec: 1000 / avgMs,
  },
});

const mockReport = (version: string, compression = 90, latency = 5): BenchmarkReport => ({
  version,
  timestamp: '2024-06-18T00:00:00.000Z',
  nodeVersion: 'v20.0.0',
  config: { iterations: 10, quick: true },
  scenarios: [mockRow('Code analysis', compression, latency)],
  compressionMatrix: [mockRow('Conversation (balanced)', compression, latency)],
  targetAIMatrix: [mockRow('Multi-AI adapter (claude)', compression, latency)],
  batch: {
    scenario: 'Batch processing',
    batchSize: 3,
    totalInputTokens: 3000,
    totalOutputTokens: 600,
    avgCompressionPct: compression,
    sequentialMs: 15,
    parallelMs: 12,
    parallelSpeedup: 1.25,
  },
  summary: {
    bestCompression: mockRow('Code analysis', compression, latency),
    fastestScenario: mockRow('Code analysis', compression, latency),
    highestQuality: mockRow('Code analysis', compression, latency),
  },
});

describe('benchmark export', () => {
  it('generates valid CSV with header and rows', () => {
    const csv = reportToCsv(mockReport('1.0.0'));
    expect(csv).toContain('section,scenario,category');
    expect(csv).toContain('scenarios,Code analysis');
    expect(csv).toContain('batch,Batch processing');
    expect(csv).toContain('meta,report');
  });

  it('round-trips JSON reports', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'h47-bench-'));
    const filePath = path.join(tmpDir, 'report.json');
    const report = mockReport('1.0.0');

    writeReportJson(report, filePath);
    const loaded = loadReportJson(filePath);
    expect(loaded.version).toBe('1.0.0');
    expect(loaded.scenarios[0].compressionPct).toBe(90);

    fs.rmSync(tmpDir, { recursive: true });
  });
});

describe('benchmark compare', () => {
  it('passes when metrics are within thresholds', () => {
    const baseline = mockReport('1.0.0', 90, 5);
    const current = mockReport('1.0.0', 89, 5.5);
    const result = compareReports(baseline, current);
    expect(result.passed).toBe(true);
  });

  it('detects compression regression beyond threshold', () => {
    const baseline = mockReport('1.0.0', 90, 5);
    const current = mockReport('1.0.1', 80, 5);
    const result = compareReports(baseline, current);
    expect(result.passed).toBe(false);
    expect(result.regressions.some((r) => r.field === 'compressionPct')).toBe(true);
  });

  it('detects latency regression when strict mode enabled', () => {
    const baseline = mockReport('1.0.0', 90, 5);
    const current = mockReport('1.0.1', 90, 10);
    const result = compareReports(baseline, current, {
      ...DEFAULT_THRESHOLDS,
      failOnLatency: true,
    });
    expect(result.passed).toBe(false);
    expect(result.regressions.some((r) => r.field === 'avgMs')).toBe(true);
  });
});
