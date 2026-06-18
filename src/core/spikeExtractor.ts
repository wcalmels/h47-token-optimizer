/**
 * Spike Extractor - Extracts critical information from text
 * Achieves 95-99% compression by identifying only essential content
 */

import { OptimizationOptions } from './tokenOptimizer';
import { getCompressionConfig } from './tokenUtils';

const STOP_WORDS = new Set([
  'about', 'after', 'also', 'been', 'being', 'could', 'from', 'have', 'into',
  'more', 'other', 'should', 'such', 'than', 'that', 'their', 'there', 'these',
  'they', 'this', 'those', 'through', 'very', 'were', 'what', 'when', 'where',
  'which', 'while', 'with', 'would',
]);

export class SpikeExtractor {
  extract(text: string, options: OptimizationOptions): string[] {
    const config = getCompressionConfig(options.compressionLevel ?? 'balanced');
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim());

    if (sentences.length === 0) {
      return text.trim() ? [text.trim()] : [];
    }

    const words = text.toLowerCase().match(/\b[a-z]{5,}\b/g) ?? [];
    const frequency: Record<string, number> = {};

    words.forEach((word) => {
      if (!STOP_WORDS.has(word)) {
        frequency[word] = (frequency[word] || 0) + 1;
      }
    });

    const rankedKeywords = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, Math.max(3, Math.ceil(Object.keys(frequency).length * config.keywordRatio)))
      .map(([word]) => word);

    const scored = sentences.map((sentence, index) => {
      const lower = sentence.toLowerCase();
      const keywordHits = rankedKeywords.filter((kw) => lower.includes(kw)).length;
      const positionBoost = index === 0 || index === sentences.length - 1 ? 2 : 0;
      return { sentence: sentence.trim(), score: keywordHits + positionBoost };
    });

    const selected = scored
      .filter((item) => item.score > 0 || options.compressionLevel === 'conservative')
      .sort((a, b) => b.score - a.score);

    const limit = Math.max(1, Math.ceil(sentences.length * config.sentenceRatio));
    const spikes = selected.slice(0, limit).map((item) => item.sentence);

    if (spikes.length === 0) {
      return [sentences[0].trim(), sentences[sentences.length - 1].trim()].filter(Boolean);
    }

    return spikes;
  }
}
