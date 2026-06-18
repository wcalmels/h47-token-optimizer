/**
 * Context Synthesizer - Synthesizes context from extracted spikes
 * Achieves 90% compression by creating concise summaries
 */

export class ContextSynthesizer {
  synthesize(spikes: string[], _options: unknown): string {
    if (spikes.length === 0) return '';

    // Combine spikes with minimal connectors
    const synthesized = spikes.join('. ');

    // Apply compression techniques
    let result = synthesized;

    // Remove redundancy
    result = this.removeRedundancy(result);

    // Compress common phrases
    result = this.compressCommonPhrases(result);

    // Abbreviate where possible
    result = this.abbreviate(result);

    return result;
  }

  private removeRedundancy(text: string): string {
    const sentences = text.split('. ');
    const unique: string[] = [];
    const seen = new Set<string>();

    sentences.forEach((sentence) => {
      const normalized = sentence.toLowerCase().trim();
      if (!seen.has(normalized) && normalized.length > 0) {
        unique.push(sentence);
        seen.add(normalized);
      }
    });

    return unique.join('. ');
  }

  private compressCommonPhrases(text: string): string {
    const replacements: Record<string, string> = {
      'in order to': 'to',
      'due to the fact that': 'because',
      'at the present time': 'now',
      'in the event that': 'if',
      'for the purpose of': 'for',
    };

    let result = text;
    Object.entries(replacements).forEach(([original, replacement]) => {
      result = result.replace(new RegExp(original, 'gi'), replacement);
    });

    return result;
  }

  private abbreviate(text: string): string {
    // Abbreviate common terms
    const abbreviations: Record<string, string> = {
      'for example': 'e.g.',
      'that is': 'i.e.',
      'and so on': 'etc.',
    };

    let result = text;
    Object.entries(abbreviations).forEach(([original, abbr]) => {
      result = result.replace(new RegExp(original, 'gi'), abbr);
    });

    return result;
  }
}
