/**
 * Shared token estimation utilities
 */

export function estimateTokens(text: string): number {
  if (!text) return 0;
  // Average ~4 chars per token for English; adjust for whitespace-heavy content
  const words = text.split(/\s+/).filter(Boolean).length;
  const charEstimate = Math.ceil(text.length / 4);
  const wordEstimate = Math.ceil(words * 1.3);
  return Math.max(charEstimate, wordEstimate);
}

export function getCompressionConfig(level: 'conservative' | 'balanced' | 'aggressive'): {
  keywordRatio: number;
  sentenceRatio: number;
  maxTokenMultiplier: number;
} {
  switch (level) {
    case 'conservative':
      return { keywordRatio: 0.5, sentenceRatio: 0.7, maxTokenMultiplier: 1.2 };
    case 'aggressive':
      return { keywordRatio: 0.15, sentenceRatio: 0.25, maxTokenMultiplier: 0.6 };
    default:
      return { keywordRatio: 0.3, sentenceRatio: 0.45, maxTokenMultiplier: 1 };
  }
}
