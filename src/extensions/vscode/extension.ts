/**
 * H47 Token Optimizer — VS Code Extension
 *
 * Copyright (c) 2024-2026 H47 Team
 * SPDX-License-Identifier: MIT
 */

import * as vscode from 'vscode';
import { H47TokenOptimizer, OptimizationResult, OptimizationOptions } from '../../core/tokenOptimizer';

const optimizer = new H47TokenOptimizer();

function getOptions(overrides: Partial<OptimizationOptions> = {}): OptimizationOptions {
  const config = vscode.workspace.getConfiguration('h47');
  return {
    targetAI: config.get('targetAI', 'generic'),
    compressionLevel: config.get('compressionLevel', 'balanced'),
    maxTokens: config.get('maxTokens', 2000),
    ...overrides,
  };
}

async function getSelectedText(): Promise<{ editor: vscode.TextEditor; text: string; selection: vscode.Selection } | null> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showErrorMessage('H47: No active editor');
    return null;
  }

  const selection = editor.selection;
  const text = editor.document.getText(selection);

  if (!text.trim()) {
    vscode.window.showErrorMessage('H47: Select text to optimize');
    return null;
  }

  return { editor, text, selection };
}

export function activate(context: vscode.ExtensionContext): void {
  const optimizePreview = vscode.commands.registerCommand('h47-optimizer.optimize', async () => {
    const ctx = await getSelectedText();
    if (!ctx) return;

    try {
      const result = await optimizer.optimize(ctx.text, getOptions());
      const showPreview = vscode.workspace.getConfiguration('h47').get('showPreview', true);

      if (showPreview) {
        const doc = await vscode.workspace.openTextDocument({
          language: 'markdown',
          content: formatResult(result),
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      } else {
        await replaceSelection(ctx.editor, ctx.selection, result);
      }

      showMetricsToast(result);
    } catch (error) {
      vscode.window.showErrorMessage(`H47: ${error instanceof Error ? error.message : error}`);
    }
  });

  const optimizeReplace = vscode.commands.registerCommand('h47-optimizer.optimize-replace', async () => {
    const ctx = await getSelectedText();
    if (!ctx) return;

    try {
      const result = await optimizer.optimize(ctx.text, getOptions());
      await replaceSelection(ctx.editor, ctx.selection, result);
      showMetricsToast(result);
    } catch (error) {
      vscode.window.showErrorMessage(`H47: ${error instanceof Error ? error.message : error}`);
    }
  });

  const optimizeClaude = vscode.commands.registerCommand('h47-optimizer.optimize-claude', async () => {
    const ctx = await getSelectedText();
    if (!ctx) return;

    try {
      const result = await optimizer.optimize(ctx.text, getOptions({ targetAI: 'claude' }));
      await replaceSelection(ctx.editor, ctx.selection, result);
      showMetricsToast(result);
    } catch (error) {
      vscode.window.showErrorMessage(`H47: ${error instanceof Error ? error.message : error}`);
    }
  });

  const statsCommand = vscode.commands.registerCommand('h47-optimizer.stats', () => {
    const stats = optimizer.getStats();
    vscode.window.showInformationMessage(
      `H47 Token Optimizer v${stats.version} · AIs: ${stats.supportedAIs.join(', ')}`
    );
  });

  context.subscriptions.push(optimizePreview, optimizeReplace, optimizeClaude, statsCommand);
}

export function deactivate(): void {}

async function replaceSelection(
  editor: vscode.TextEditor,
  selection: vscode.Selection,
  result: OptimizationResult
): Promise<void> {
  await editor.edit((edit) => edit.replace(selection, result.optimized.text));
}

function showMetricsToast(result: OptimizationResult): void {
  vscode.window.setStatusBarMessage(
    `H47: ${result.metrics.compression}% compression · ${result.metrics.savings} tokens saved`,
    5000
  );
}

function formatResult(result: OptimizationResult): string {
  return `# H47 Token Optimizer Result

## Original (${result.original.tokenCount} tokens)
\`\`\`
${result.original.text}
\`\`\`

## Optimized (${result.optimized.tokenCount} tokens)
\`\`\`
${result.optimized.text}
\`\`\`

## Metrics
| Metric | Value |
|--------|------:|
| Compression | ${result.metrics.compression}% |
| Quality (heuristic) | ${(result.metrics.quality * 100).toFixed(1)}% |
| Tokens saved | ${result.metrics.savings} |
| Strategy | ${result.strategy} |

> Quality is a heuristic. See [limitations](https://github.com/wcalmels/h47-token-optimizer/blob/main/docs/LIMITATIONS.md).
`;
}
