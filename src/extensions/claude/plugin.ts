/**
 * H47 Token Optimizer - Claude Plugin
 * Claude integration for token optimization
 */

import { H47TokenOptimizer } from '../../core/tokenOptimizer';

const optimizer = new H47TokenOptimizer();

/**
 * Claude Plugin API
 */
export class ClaudeH47Plugin {
  /**
   * Optimize text for Claude
   */
  static async optimizeForClaude(text: string, options: any = {}) {
    return await optimizer.optimize(text, {
      targetAI: 'claude',
      compressionLevel: options.compression || 'balanced',
      qualityThreshold: options.quality || 0.95,
      maxTokens: options.maxTokens || 100000,
    });
  }

  /**
   * Optimize conversation history
   */
  static async optimizeConversation(messages: any[], options: any = {}) {
    const conversationText = messages
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n\n');

    return await optimizer.optimize(conversationText, {
      targetAI: 'claude',
      compressionLevel: options.compression || 'aggressive',
      qualityThreshold: options.quality || 0.95,
    });
  }

  /**
   * Optimize system prompt
   */
  static async optimizeSystemPrompt(systemPrompt: string, options: any = {}) {
    return await optimizer.optimize(systemPrompt, {
      targetAI: 'claude',
      compressionLevel: options.compression || 'conservative',
      qualityThreshold: options.quality || 0.99,
    });
  }

  /**
   * Get plugin info
   */
  static getInfo() {
    const stats = optimizer.getStats();
    return {
      name: 'H47 Token Optimizer',
      version: stats.version,
      description: 'Reduce tokens 70-90% while maintaining quality',
      capabilities: [
        'optimize-text',
        'optimize-conversation',
        'optimize-system-prompt',
      ],
    };
  }
}

export default ClaudeH47Plugin;
