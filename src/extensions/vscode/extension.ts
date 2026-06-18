/**
 * H47 Token Optimizer - VS Code Extension
 * Integrates token optimization directly into VS Code
 */

import * as vscode from 'vscode';
import { H47TokenOptimizer } from '../../core/tokenOptimizer';

const optimizer = new H47TokenOptimizer();

export function activate(context: vscode.ExtensionContext) {
  console.log('H47 Token Optimizer extension activated');

  // Command: Optimize selected text
  const optimizeCommand = vscode.commands.registerCommand(
    'h47-optimizer.optimize',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }

      try {
        const result = await optimizer.optimize(text, {
          targetAI: 'generic',
          compressionLevel: 'balanced',
        });

        // Show result in new document
        const doc = await vscode.workspace.openTextDocument({
          language: 'markdown',
          content: formatResult(result),
        });

        await vscode.window.showTextDocument(doc);
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  // Command: Optimize for Claude
  const claudeCommand = vscode.commands.registerCommand(
    'h47-optimizer.optimize-claude',
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showErrorMessage('No active editor');
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);

      if (!text) {
        vscode.window.showErrorMessage('No text selected');
        return;
      }

      try {
        const result = await optimizer.optimize(text, {
          targetAI: 'claude',
          compressionLevel: 'balanced',
        });

        editor.edit((editBuilder) => {
          editBuilder.replace(selection, result.optimized.text);
        });

        vscode.window.showInformationMessage(
          `Optimized! Compression: ${result.metrics.compression}%, Quality: ${(result.metrics.quality * 100).toFixed(1)}%`
        );
      } catch (error) {
        vscode.window.showErrorMessage(`Error: ${error}`);
      }
    }
  );

  // Command: Show statistics
  const statsCommand = vscode.commands.registerCommand('h47-optimizer.stats', () => {
    const stats = optimizer.getStats();
    vscode.window.showInformationMessage(
      `H47 Token Optimizer v${stats.version}\nSupported AIs: ${stats.supportedAIs.join(', ')}`
    );
  });

  context.subscriptions.push(optimizeCommand, claudeCommand, statsCommand);
}

export function deactivate() {
  console.log('H47 Token Optimizer extension deactivated');
}

function formatResult(result: any): string {
  return `# H47 Token Optimizer Result

## Original
- Tokens: ${result.original.tokenCount}
- Complexity: ${result.original.complexity.toFixed(2)}

\`\`\`
${result.original.text}
\`\`\`

## Optimized
- Tokens: ${result.optimized.tokenCount}
- Complexity: ${result.optimized.complexity.toFixed(2)}

\`\`\`
${result.optimized.text}
\`\`\`

## Metrics
- Compression: ${result.metrics.compression}%
- Quality: ${(result.metrics.quality * 100).toFixed(2)}%
- Speedup: ${result.metrics.speedup}x
- Tokens Saved: ${result.metrics.savings}

## Strategy
${result.strategy}
`;
}
