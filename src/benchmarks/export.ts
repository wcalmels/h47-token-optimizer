/**
 * Export benchmark reports to CSV and JSON
 */

import * as fs from 'fs';
import * as path from 'path';
import { BenchmarkReport } from './types';
import { BenchmarkRow } from './runner';

function escapeCsv(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCsv(section: string, row: BenchmarkRow): string {
  return [
    section,
    row.scenario,
    row.category,
    row.targetAI,
    row.compressionLevel,
    row.inputTokens,
    row.outputTokens,
    row.compressionPct,
    row.quality,
    row.tokensSaved,
    row.latency.avgMs,
    row.latency.p50Ms,
    row.latency.p95Ms,
    row.latency.minMs,
    row.latency.maxMs,
    row.latency.opsPerSec,
    row.latency.runs,
  ]
    .map(escapeCsv)
    .join(',');
}

const CSV_HEADER =
  'section,scenario,category,targetAI,compressionLevel,inputTokens,outputTokens,compressionPct,quality,tokensSaved,avgMs,p50Ms,p95Ms,minMs,maxMs,opsPerSec,runs';

export function reportToCsv(report: BenchmarkReport): string {
  const lines = [CSV_HEADER];

  for (const row of report.scenarios) {
    lines.push(rowToCsv('scenarios', row));
  }
  for (const row of report.compressionMatrix) {
    lines.push(rowToCsv('compressionMatrix', row));
  }
  for (const row of report.targetAIMatrix) {
    lines.push(rowToCsv('targetAIMatrix', row));
  }

  lines.push(
    [
      'batch',
      report.batch.scenario,
      'batch',
      '',
      '',
      report.batch.totalInputTokens,
      report.batch.totalOutputTokens,
      report.batch.avgCompressionPct,
      '',
      report.batch.totalInputTokens - report.batch.totalOutputTokens,
      report.batch.sequentialMs,
      '',
      '',
      report.batch.parallelMs,
      report.batch.parallelSpeedup,
      report.batch.batchSize,
      '',
    ]
      .map(escapeCsv)
      .join(',')
  );

  lines.push(
    [
      'meta',
      'report',
      report.version,
      report.nodeVersion,
      report.timestamp,
      report.config.iterations,
      report.config.quick ? 1 : 0,
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]
      .map(escapeCsv)
      .join(',')
  );

  return lines.join('\n') + '\n';
}

export function writeReportCsv(report: BenchmarkReport, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, reportToCsv(report), 'utf-8');
}

export function writeReportJson(report: BenchmarkReport, outputPath: string): void {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf-8');
}

export function loadReportJson(inputPath: string): BenchmarkReport {
  const content = fs.readFileSync(inputPath, 'utf-8');
  return JSON.parse(content) as BenchmarkReport;
}
