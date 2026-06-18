/**
 * H47 Token Optimizer - Cursor Extension
 * Integrates token optimization into Cursor IDE
 */

import { H47TokenOptimizer } from '../../core/tokenOptimizer';

const optimizer = new H47TokenOptimizer();

/**
 * Cursor Extension API
 * Provides token optimization capabilities to Cursor
 */
export class CursorH47Extension {
  /**
   * Optimize code for AI analysis
   */
  static async optimizeCode(code: string, options: any = {}) {
    return await optimizer.optimize(code, {
      targetAI: 'cursor',
      compressionLevel: options.compression || 'balanced',
      qualityThreshold: options.quality || 0.95,
    });
  }

  /**
   * Optimize prompt for Cursor AI
   */
  static async optimizePrompt(prompt: string, options: any = {}) {
    return await optimizer.optimize(prompt, {
      targetAI: 'cursor',
      compressionLevel: options.compression || 'aggressive',
      qualityThreshold: options.quality || 0.95,
    });
  }

  /**
   * Get optimization stats
   */
  static getStats() {
    return optimizer.getStats();
  }

  /**
   * Batch optimize multiple code snippets
   */
  static async optimizeCodeBatch(codes: string[], options: any = {}) {
    return await optimizer.optimizeBatch(codes, {
      targetAI: 'cursor',
      compressionLevel: options.compression || 'balanced',
    });
  }
}

// Export for use in Cursor
export default CursorH47Extension;
