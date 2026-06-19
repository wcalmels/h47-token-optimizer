# One-time publish setup

Complete these steps once to enable automated publishing from GitHub Actions.

## 1. NPM (`h47-token-optimizer`) — pending

npm **no ofrece tokens Classic** desde nov 2025. Usa una de estas opciones:

### Opción A — Trusted Publishing (recomendado, sin token)

Guía completa en español: **[docs/NPM_PUBLISH_ES.md](./NPM_PUBLISH_ES.md)**

Resumen:
1. [npmjs.com/package/h47-token-optimizer](https://www.npmjs.com/package/h47-token-optimizer) → **Settings** → **Trusted Publisher**
2. **GitHub Actions** → repo `wcalmels/h47-token-optimizer` → workflow `publish.yml`
3. `gh workflow run "Publish to NPM" -R wcalmels/h47-token-optimizer`

### Opción B — Token Granular con Bypass 2FA

1. [npmjs.com/settings/wcalmels/tokens](https://www.npmjs.com/settings/wcalmels/tokens) → **Granular Access Token**
2. **Read and write** → al **final del formulario** activa **Bypass 2FA**
3. `gh secret set NPM_TOKEN -R wcalmels/h47-token-optimizer`

> Sin **Bypass 2FA** falla con: `Two-factor authentication or granular access token with bypass 2fa enabled is required`

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
