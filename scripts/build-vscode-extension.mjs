/**
 * Bundle the VS Code extension + core engine into a single CommonJS file.
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

import * as esbuild from 'esbuild';
import { mkdirSync } from 'fs';

mkdirSync('extensions/vscode/out', { recursive: true });

await esbuild.build({
  entryPoints: ['src/extensions/vscode/extension.ts'],
  bundle: true,
  outfile: 'extensions/vscode/out/extension.js',
  external: ['vscode'],
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  sourcemap: true,
  logLevel: 'info',
});

console.log('✓ VS Code extension bundled → extensions/vscode/out/extension.js');
