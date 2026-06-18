#!/usr/bin/env node

/**
 * H47 Token Optimizer CLI
 * Command-line interface for token optimization
 */

import { Command } from 'commander';
import { H47TokenOptimizer, OptimizationResult } from '../core/tokenOptimizer';
import * as fs from 'fs';

const program = new Command();
const optimizer = new H47TokenOptimizer();

const SUBCOMMANDS = new Set(['batch', 'stats', 'help', 'optimize']);

function injectDefaultCommand(): void {
  const args = process.argv.slice(2);
  if (args.length === 0) return;

  const first = args[0];
  if (first.startsWith('-') || SUBCOMMANDS.has(first)) return;

  process.argv.splice(2, 0, 'optimize');
}

program
  .name('h47-optimize')
  .description('H47 Token Optimizer - Reduce tokens 70-90% for any AI model')
  .version('1.0.0');

program
  .command('optimize [text...]')
  .description('Optimize a prompt or text')
  .option('-a, --ai <model>', 'Target AI model (claude, gpt, cursor, generic)', 'generic')
  .option('-c, --compression <level>', 'Compression level (conservative, balanced, aggressive)', 'balanced')
  .option('-q, --quality <threshold>', 'Quality threshold (0-1)', '0.95')
  .option('-m, --max-tokens <number>', 'Maximum tokens', '2000')
  .option('-j, --json', 'Output as JSON')
  .action(async (textParts: string[], options) => {
    try {
      const text = textParts.join(' ').trim();
      if (!text) {
        console.error('Error: text is required');
        process.exit(1);
      }

      const result = await optimizer.optimize(text, {
        targetAI: options.ai,
        compressionLevel: options.compression,
        qualityThreshold: parseFloat(options.quality),
        maxTokens: parseInt(options.maxTokens, 10),
      });

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        printOptimizationResult(result);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('batch <file>')
  .description('Optimize multiple prompts from a file')
  .option('-a, --ai <model>', 'Target AI model', 'generic')
  .option('-c, --compression <level>', 'Compression level', 'balanced')
  .option('-o, --output <file>', 'Output file (default: stdout)')
  .action(async (file, options) => {
    try {
      if (!fs.existsSync(file)) {
        console.error(`File not found: ${file}`);
        process.exit(1);
      }

      const content = fs.readFileSync(file, 'utf-8');
      const texts = content.split('\n---\n').filter((t) => t.trim());

      console.log(`Processing ${texts.length} prompts...`);

      const results = await optimizer.optimizeBatch(texts, {
        targetAI: options.ai,
        compressionLevel: options.compression,
      });

      const output = results
        .map(
          (r) =>
            `ORIGINAL (${r.original.tokenCount} tokens):\n${r.original.text}\n\n` +
            `OPTIMIZED (${r.optimized.tokenCount} tokens, ${r.metrics.compression}% compression):\n${r.optimized.text}\n\n` +
            `METRICS: Quality=${r.metrics.quality}, Speedup=${r.metrics.speedup}x\n` +
            `---\n`
        )
        .join('\n');

      if (options.output) {
        fs.writeFileSync(options.output, output);
        console.log(`Results saved to ${options.output}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show optimizer statistics')
  .action(() => {
    const stats = optimizer.getStats();
    console.log('\n📊 H47 Token Optimizer Statistics\n');
    console.log(`Version: ${stats.version}`);
    console.log(`Supported AIs: ${stats.supportedAIs.join(', ')}`);
    console.log(`Compression Levels: ${stats.compressionLevels.join(', ')}`);
    console.log('\n');
  });

injectDefaultCommand();
program.parse(process.argv);

if (!process.argv.slice(2).length) {
  program.outputHelp();
}

function printOptimizationResult(result: OptimizationResult): void {
  const preview = (value: string) =>
    value.length > 100 ? `${value.substring(0, 100)}...` : value;

  console.log('\n' + '='.repeat(60));
  console.log('📊 H47 Token Optimizer Result');
  console.log('='.repeat(60) + '\n');

  console.log('📝 ORIGINAL:');
  console.log(`   Tokens: ${result.original.tokenCount}`);
  console.log(`   Complexity: ${result.original.complexity.toFixed(2)}`);
  console.log(`   Text: ${preview(result.original.text)}`);

  console.log('\n✨ OPTIMIZED:');
  console.log(`   Tokens: ${result.optimized.tokenCount}`);
  console.log(`   Complexity: ${result.optimized.complexity.toFixed(2)}`);
  console.log(`   Text: ${preview(result.optimized.text)}`);

  console.log('\n📈 METRICS:');
  console.log(`   Compression: ${result.metrics.compression}%`);
  console.log(`   Quality: ${(result.metrics.quality * 100).toFixed(2)}%`);
  console.log(`   Speedup: ${result.metrics.speedup}x`);
  console.log(`   Tokens Saved: ${result.metrics.savings}`);

  console.log(`\n🎯 Strategy: ${result.strategy}`);
  console.log('='.repeat(60) + '\n');
}
