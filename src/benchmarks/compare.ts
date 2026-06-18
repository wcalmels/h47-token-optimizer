/**
 * Compare two benchmark reports and detect regressions
 */

import { BenchmarkReport, CompareThresholds, ComparisonMetric, ComparisonResult } from './types';
import { BenchmarkRow } from './runner';

const DEFAULT_THRESHOLDS: CompareThresholds = {
  maxLatencyRegressionPct: 50,
  maxCompressionRegressionPct: 5,
  maxQualityRegressionPct: 3,
  failOnLatency: false,
};

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function deltaPct(baseline: number, current: number): number {
  if (baseline === 0) return current === 0 ? 0 : 100;
  return round(((current - baseline) / baseline) * 100);
}

function evaluateMetric(
  section: string,
  scenario: string,
  field: string,
  baseline: number,
  current: number,
  higherIsBetter: boolean,
  thresholds: CompareThresholds
): ComparisonMetric {
  const delta = round(current - baseline);
  const pct = deltaPct(baseline, current);

  let status: ComparisonMetric['status'] = 'ok';
  const isRegression = higherIsBetter ? delta < 0 : delta > 0;
  const isImprovement = higherIsBetter ? delta > 0 : delta < 0;

  if (isRegression) {
    const absPct = Math.abs(pct);
    const isLatencyField = field === 'avgMs' || field === 'p95Ms' || field === 'sequentialMs';

    if (isLatencyField && !thresholds.failOnLatency) {
      status = 'ok';
    } else {
      const limit =
        field === 'compressionPct'
          ? thresholds.maxCompressionRegressionPct
          : field === 'quality'
            ? thresholds.maxQualityRegressionPct
            : thresholds.maxLatencyRegressionPct;

      if (absPct > limit) {
        status = 'regression';
      }
    }
  } else if (isImprovement && Math.abs(pct) > 1) {
    status = 'improvement';
  }

  return { scenario, section, field, baseline, current, delta, deltaPct: pct, status };
}

function compareRows(
  section: string,
  baselineRows: BenchmarkRow[],
  currentRows: BenchmarkRow[],
  thresholds: CompareThresholds
): ComparisonMetric[] {
  const metrics: ComparisonMetric[] = [];

  for (const baselineRow of baselineRows) {
    const currentRow = currentRows.find((r) => r.scenario === baselineRow.scenario);
    if (!currentRow) continue;

    metrics.push(
      evaluateMetric(
        section,
        baselineRow.scenario,
        'compressionPct',
        baselineRow.compressionPct,
        currentRow.compressionPct,
        true,
        thresholds
      ),
      evaluateMetric(
        section,
        baselineRow.scenario,
        'quality',
        baselineRow.quality,
        currentRow.quality,
        true,
        thresholds
      ),
      evaluateMetric(
        section,
        baselineRow.scenario,
        'avgMs',
        baselineRow.latency.avgMs,
        currentRow.latency.avgMs,
        false,
        thresholds
      ),
      evaluateMetric(
        section,
        baselineRow.scenario,
        'p95Ms',
        baselineRow.latency.p95Ms,
        currentRow.latency.p95Ms,
        false,
        thresholds
      )
    );
  }

  return metrics;
}

export function compareReports(
  baseline: BenchmarkReport,
  current: BenchmarkReport,
  thresholds: CompareThresholds = DEFAULT_THRESHOLDS
): ComparisonResult {
  const metrics = [
    ...compareRows('scenarios', baseline.scenarios, current.scenarios, thresholds),
    ...compareRows(
      'compressionMatrix',
      baseline.compressionMatrix,
      current.compressionMatrix,
      thresholds
    ),
    ...compareRows('targetAIMatrix', baseline.targetAIMatrix, current.targetAIMatrix, thresholds),
    evaluateMetric(
      'batch',
      'Batch processing',
      'avgCompressionPct',
      baseline.batch.avgCompressionPct,
      current.batch.avgCompressionPct,
      true,
      thresholds
    ),
    evaluateMetric(
      'batch',
      'Batch processing',
      'sequentialMs',
      baseline.batch.sequentialMs,
      current.batch.sequentialMs,
      false,
      thresholds
    ),
  ];

  const regressions = metrics.filter((m) => m.status === 'regression');
  const improvements = metrics.filter((m) => m.status === 'improvement');

  return {
    baselineVersion: baseline.version,
    currentVersion: current.version,
    baselineTimestamp: baseline.timestamp,
    currentTimestamp: current.timestamp,
    metrics,
    regressions,
    improvements,
    passed: regressions.length === 0,
  };
}

export function printComparison(result: ComparisonResult): void {
  console.log('\n' + '═'.repeat(80));
  console.log('  BENCHMARK COMPARISON');
  console.log('═'.repeat(80));
  console.log(`  Baseline:  v${result.baselineVersion} (${result.baselineTimestamp})`);
  console.log(`  Current:   v${result.currentVersion} (${result.currentTimestamp})`);
  console.log('═'.repeat(80));

  console.log(
    '\n' +
      pad('Scenario', 32) +
      pad('Metric', 14) +
      pad('Baseline', 10) +
      pad('Current', 10) +
      pad('Delta', 10) +
      pad('Status', 12)
  );
  console.log('─'.repeat(80));

  for (const metric of result.metrics) {
    const statusIcon =
      metric.status === 'regression' ? '✗ REGRESS' : metric.status === 'improvement' ? '↑ BETTER' : '✓ ok';
    console.log(
      pad(metric.scenario, 32) +
        pad(metric.field, 14) +
        pad(formatValue(metric.field, metric.baseline), 10) +
        pad(formatValue(metric.field, metric.current), 10) +
        pad(`${metric.deltaPct >= 0 ? '+' : ''}${metric.deltaPct}%`, 10) +
        pad(statusIcon, 12)
    );
  }

  console.log('\n' + '═'.repeat(80));
  console.log(`  Regressions:  ${result.regressions.length}`);
  if (!result.regressions.length) {
    console.log('  (Latency deltas shown for info; use --strict to fail on latency)');
  }
  console.log(`  Improvements: ${result.improvements.length}`);
  console.log(`  Result:       ${result.passed ? '✓ PASSED' : '✗ FAILED'}`);
  console.log('═'.repeat(80) + '\n');
}

function formatValue(field: string, value: number): string {
  if (field === 'quality') return `${(value * 100).toFixed(1)}%`;
  if (field === 'compressionPct') return `${value}%`;
  return String(value);
}

function pad(value: string, width: number): string {
  return value.length >= width ? value.slice(0, width) : value.padEnd(width);
}

export { DEFAULT_THRESHOLDS };
