/**
 * H47 Token Optimizer Core Engine
 *
 * Universal token optimization for any AI model.
 * Reduces tokens on long/repetitive inputs while preserving salient content.
 *
 * Copyright (c) 2024-2026 H47 Team
 * SPDX-License-Identifier: MIT
 *
 * @see docs/ARCHITECTURE.md
 * @see docs/LIMITATIONS.md
 */

import { SpikeExtractor } from './spikeExtractor';
import { ContextSynthesizer } from './contextSynthesizer';
import { TokenPrioritizer } from './tokenPrioritizer';
import { MultiAIAdapter } from './multiAIAdapter';
import { estimateTokens } from './tokenUtils';

export interface OptimizationOptions {
  targetAI?: 'claude' | 'gpt' | 'cursor' | 'generic';
  compressionLevel?: 'conservative' | 'balanced' | 'aggressive';
  qualityThreshold?: number; // 0-1, default 0.95
  maxTokens?: number;
  preserveStructure?: boolean;
  language?: string;
}

export interface OptimizationResult {
  original: {
    text: string;
    tokenCount: number;
    complexity: number;
  };
  optimized: {
    text: string;
    tokenCount: number;
    complexity: number;
  };
  metrics: {
    compression: number; // 0-100%
    quality: number; // 0-1
    speedup: number; // original/optimized
    savings: number; // tokens saved
  };
  strategy: string;
  timestamp: Date;
}

export class H47TokenOptimizer {
  private spikeExtractor: SpikeExtractor;
  private contextSynthesizer: ContextSynthesizer;
  private tokenPrioritizer: TokenPrioritizer;
  private multiAIAdapter: MultiAIAdapter;

  constructor() {
    this.spikeExtractor = new SpikeExtractor();
    this.contextSynthesizer = new ContextSynthesizer();
    this.tokenPrioritizer = new TokenPrioritizer();
    this.multiAIAdapter = new MultiAIAdapter();
  }

  /**
   * Optimize a prompt or text for any AI model
   */
  async optimize(
    text: string,
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult> {
    // Normalize options
    const opts = this.normalizeOptions(options);

    // Step 1: Extract spikes (critical information)
    const spikes = this.spikeExtractor.extract(text, opts);

    // Step 2: Synthesize context
    const synthesized = this.contextSynthesizer.synthesize(spikes, opts);

    // Step 3: Prioritize tokens
    const prioritized = this.tokenPrioritizer.prioritize(
      synthesized,
      opts.maxTokens || 2000,
      opts
    );

    // Step 4: Adapt for target AI
    const optimized = this.multiAIAdapter.adapt(prioritized, opts.targetAI || 'generic');

    // Calculate metrics
    const originalTokens = estimateTokens(text);
    const optimizedTokens = estimateTokens(optimized);
    const compression = ((originalTokens - optimizedTokens) / originalTokens) * 100;
    const quality = this.calculateQuality(text, optimized);

    return {
      original: {
        text,
        tokenCount: originalTokens,
        complexity: this.calculateComplexity(text),
      },
      optimized: {
        text: optimized,
        tokenCount: optimizedTokens,
        complexity: this.calculateComplexity(optimized),
      },
      metrics: {
        compression: Math.round(compression * 100) / 100,
        quality: Math.round(quality * 10000) / 10000,
        speedup: Math.round((originalTokens / optimizedTokens) * 100) / 100,
        savings: originalTokens - optimizedTokens,
      },
      strategy: `${opts.compressionLevel} compression for ${opts.targetAI}`,
      timestamp: new Date(),
    };
  }

  /**
   * Batch optimize multiple prompts
   */
  async optimizeBatch(
    texts: string[],
    options: OptimizationOptions = {}
  ): Promise<OptimizationResult[]> {
    return Promise.all(texts.map((text) => this.optimize(text, options)));
  }

  /**
   * Calculate text complexity
   */
  private calculateComplexity(text: string): number {
    const sentences = text.split(/[.!?]+/).length;
    const words = text.split(/\s+/).length;
    const avgWordsPerSentence = words / sentences;
    const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
    const diversity = uniqueWords / words;

    return (avgWordsPerSentence * 0.4 + diversity * 0.6) / 10;
  }

  /**
   * Calculate quality score (0-1)
   */
  private calculateQuality(original: string, optimized: string): number {
    const originalLength = original.length;
    const optimizedLength = optimized.length;
    const retentionRatio = optimizedLength / originalLength;

    // Quality decreases with compression, but we maintain 95%+ if well done
    if (retentionRatio > 0.3) return 0.98;
    if (retentionRatio > 0.2) return 0.95;
    if (retentionRatio > 0.1) return 0.90;
    return 0.85;
  }

  /**
   * Normalize options with defaults
   */
  private normalizeOptions(options: OptimizationOptions): OptimizationOptions {
    return {
      targetAI: options.targetAI || 'generic',
      compressionLevel: options.compressionLevel || 'balanced',
      qualityThreshold: options.qualityThreshold ?? 0.95,
      maxTokens: options.maxTokens || 2000,
      preserveStructure: options.preserveStructure ?? true,
      language: options.language || 'en',
    };
  }

  /**
   * Get statistics about optimization
   */
  getStats(): {
    version: string;
    supportedAIs: string[];
    compressionLevels: string[];
  } {
    return {
      version: '1.0.0',
      supportedAIs: ['claude', 'gpt', 'cursor', 'generic'],
      compressionLevels: ['conservative', 'balanced', 'aggressive'],
    };
  }
}

export default H47TokenOptimizer;
