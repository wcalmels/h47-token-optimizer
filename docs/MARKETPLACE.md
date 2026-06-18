# Publishing to VS Code Marketplace (and Cursor)

The extension lives in `extensions/vscode/`. It bundles the core engine into a single file — no external dependencies at runtime.

## Prerequisites

1. **Publisher account** — [Create a publisher](https://marketplace.visualstudio.com/manage) named `wcalmels` (or change `publisher` in `extensions/vscode/package.json`).
2. **Personal Access Token** — [Azure DevOps PAT](https://dev.azure.com) with **Marketplace → Manage** scope.
3. **Icon** — 128×128 PNG at `extensions/vscode/icon.png` (required for listing quality).

## Build & test locally

```bash
npm install
npm run extension:build    # bundle → extensions/vscode/out/extension.js
npm run extension:pack     # creates .vsix file

# Install in VS Code / Cursor
code --install-extension extensions/vscode/h47-token-optimizer-1.0.0.vsix
```

## Publish to VS Code Marketplace

```bash
# One-time login
npx vsce login wcalmels

# Publish (bumps not included — update version in package.json first)
npm run extension:publish
```

Or set secret `VSCE_PAT` in GitHub and run **Actions → Publish VS Code Extension → Run workflow**.

## Publish to Open VSX (Cursor / VSCodium)

```bash
npm install -g ovsx
npm run extension:pack
ovsx publish extensions/vscode/h47-token-optimizer-1.0.0.vsix -p $OPENVSX_TOKEN
```

Register at [open-vsx.org](https://open-vsx.org/).

## Cursor

Cursor installs VS Code-compatible extensions. Options:

1. **VSIX manually** — build with `npm run extension:pack`, install from VSIX.
2. **Open VSX** — publish there; Cursor can pull from Open VSX.
3. **VS Code Marketplace** — some Cursor builds support direct Marketplace install.

## Checklist before first publish

- [ ] Icon at `extensions/vscode/icon.png` (128×128)
- [ ] Version bumped in `extensions/vscode/package.json`
- [ ] `CHANGELOG.md` updated
- [ ] Test VSIX locally on real selection
- [ ] Publisher ID matches your Marketplace account

## Revenue note

The extension is free (MIT). Marketplace distribution drives adoption for hosted API / enterprise tiers. See [BUSINESS.md](./BUSINESS.md).
