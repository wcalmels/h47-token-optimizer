/**
 * Copy LICENSE into extension folder for vsce packaging.
 */

import { copyFileSync, existsSync } from 'fs';

copyFileSync('LICENSE', 'extensions/vscode/LICENSE');

if (!existsSync('extensions/vscode/icon.png')) {
  console.warn('⚠ extensions/vscode/icon.png missing — add 128×128 PNG before Marketplace publish');
}

console.log('✓ Extension package prepared');
