/**
 * Token Prioritizer - Prioritizes tokens within budget
 * Ensures most important information stays within token limit
 */

import { OptimizationOptions } from './tokenOptimizer';
import { estimateTokens, getCompressionConfig } from './tokenUtils';

export class TokenPrioritizer {
  prioritize(text: string, maxTokens: number, options: OptimizationOptions): string {
    const config = getCompressionConfig(options.compressionLevel ?? 'balanced');
    const effectiveMax = Math.floor(maxTokens * config.maxTokenMultiplier);
    const estimatedTokens = estimateTokens(text);

    // If within budget, return as is
    if (estimatedTokens <= effectiveMax) {
      return text;
    }

    const compressionRatio = effectiveMax / estimatedTokens;
    const targetLength = Math.floor(text.length * compressionRatio);

    // Prioritize by keeping first and last parts
    if (targetLength < 100) {
      return text.substring(0, targetLength) + '...';
    }

    const firstPart = Math.floor(targetLength * 0.6);
    const lastPart = targetLength - firstPart - 3;

    return text.substring(0, firstPart) + '...' + text.substring(text.length - lastPart);
  }
}
