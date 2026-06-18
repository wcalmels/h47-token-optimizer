import { describe, it, expect } from 'vitest';
import { H47TokenOptimizer } from '../src/core/tokenOptimizer';
import { estimateTokens, getCompressionConfig } from '../src/core/tokenUtils';
import { ClaudeH47Plugin } from '../src/extensions/claude/plugin';
import { CursorH47Extension } from '../src/extensions/cursor/extension';

const SAMPLE_TEXT = `
In order to build a robust token optimization engine, we need to extract the most
important information from long prompts. Due to the fact that AI models charge by
token usage, reducing prompt size saves cost and latency. The system should preserve
semantic meaning while removing redundancy. For example, legal documents require
conservative compression. Code analysis prompts benefit from aggressive compression.
At the present time, multiple AI providers exist including Claude, ChatGPT, and Cursor.
`.trim();

describe('tokenUtils', () => {
  it('estimates tokens for non-empty text', () => {
    expect(estimateTokens('hello world')).toBeGreaterThan(0);
    expect(estimateTokens('')).toBe(0);
  });

  it('returns compression configs per level', () => {
    const aggressive = getCompressionConfig('aggressive');
    const conservative = getCompressionConfig('conservative');
    expect(aggressive.sentenceRatio).toBeLessThan(conservative.sentenceRatio);
  });
});

describe('H47TokenOptimizer', () => {
  const optimizer = new H47TokenOptimizer();

  it('optimizes text and reduces token count', async () => {
    const result = await optimizer.optimize(SAMPLE_TEXT, {
      targetAI: 'generic',
      compressionLevel: 'balanced',
    });

    expect(result.optimized.tokenCount).toBeLessThan(result.original.tokenCount);
    expect(result.metrics.compression).toBeGreaterThan(0);
    expect(result.optimized.text.length).toBeGreaterThan(0);
  });

  it('adapts output for Claude', async () => {
    const result = await optimizer.optimize(SAMPLE_TEXT, { targetAI: 'claude' });
    expect(result.optimized.text).toContain('concise response');
  });

  it('supports batch optimization', async () => {
    const results = await optimizer.optimizeBatch([SAMPLE_TEXT, SAMPLE_TEXT]);
    expect(results).toHaveLength(2);
  });

  it('returns product stats', () => {
    const stats = optimizer.getStats();
    expect(stats.version).toBe('1.0.0');
    expect(stats.supportedAIs).toContain('claude');
  });
});

describe('ClaudeH47Plugin', () => {
  it('exposes plugin metadata', () => {
    const info = ClaudeH47Plugin.getInfo();
    expect(info.name).toBe('H47 Token Optimizer');
    expect(info.capabilities).toContain('optimize-text');
  });
});

describe('CursorH47Extension', () => {
  it('optimizes code snippets for Cursor', async () => {
    const code = 'function add(a, b) { return a + b; } // helper for math operations';
    const result = await CursorH47Extension.optimizeCode(code);
    expect(result.optimized.text.length).toBeGreaterThan(0);
  });
});
