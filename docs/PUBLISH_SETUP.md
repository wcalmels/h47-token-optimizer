# One-time publish setup

Complete these steps once to enable automated publishing from GitHub Actions.

## 1. NPM (`@wcalmels/h47-token-optimizer`) — published, pending public visibility

Published versions **1.0.0** and **1.0.1** to npm. If `npm install` returns 404, approve the **staged release** on [npmjs.com](https://www.npmjs.com) → Packages → `@wcalmels/h47-token-optimizer`.

```bash
npm install @wcalmels/h47-token-optimizer
npx h47-optimize "test prompt"
```

Guía: **[docs/NPM_PUBLISH_ES.md](./NPM_PUBLISH_ES.md)**

## 2. VS Code Marketplace — done

Published: [wcalmels.h47-token-optimizer](https://marketplace.visualstudio.com/items?itemName=wcalmels.h47-token-optimizer)

Install in VS Code / Cursor: search **H47 Token Optimizer** or `Ctrl+Shift+O` on selected text.

<details>
<summary>Republish / update VSCE_PAT</summary>

1. Create Azure DevOps PAT:
   - **Organization:** `All accessible organizations`
   - **Scopes:** **Marketplace → Manage**
2. Update secret and publish:

   ```powershell
   gh secret set VSCE_PAT -R wcalmels/h47-token-optimizer
   gh workflow run "Publish VS Code Extension" -R wcalmels/h47-token-optimizer
   ```

</details>

## 3. Open VSX (Cursor / VSCodium)

1. Register at [open-vsx.org](https://open-vsx.org/).
2. Generate token and publish manually:

   ```bash
   npm run extension:pack
   npx ovsx publish extensions/vscode/h47-token-optimizer-1.0.0.vsix -p YOUR_TOKEN
   ```

## 4. Pin repo on your GitHub profile

GitHub API does not expose profile pinning — do this in the UI:

1. Go to [github.com/wcalmels](https://github.com/wcalmels)
2. **Customize your pins** → select **h47-token-optimizer**

## 5. Install without Marketplace

Download the `.vsix` from [Releases](https://github.com/wcalmels/h47-token-optimizer/releases) and install:

```bash
code --install-extension h47-token-optimizer-1.0.0.vsix
```

Or in Cursor: Extensions → … → **Install from VSIX**.
