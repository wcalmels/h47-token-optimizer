/**
 * Multi-AI Adapter - Adapts optimized text for specific AI models
 * Formats output according to each AI's preferences
 */

export class MultiAIAdapter {
  adapt(text: string, targetAI: string): string {
    switch (targetAI) {
      case 'claude':
        return this.adaptForClaude(text);
      case 'gpt':
        return this.adaptForGPT(text);
      case 'cursor':
        return this.adaptForCursor(text);
      default:
        return text;
    }
  }

  private adaptForClaude(text: string): string {
    // Claude prefers clear structure and explicit instructions
    return `${text}\n\n[Provide a concise response based on the above information]`;
  }

  private adaptForGPT(text: string): string {
    // GPT works well with direct prompts
    return `${text}\n\nRespond concisely:`;
  }

  private adaptForCursor(text: string): string {
    // Cursor (code-focused) prefers code context
    if (text.includes('code') || text.includes('function')) {
      return `\`\`\`\n${text}\n\`\`\`\n\nExplain and optimize this code:`;
    }
    return text;
  }
}
