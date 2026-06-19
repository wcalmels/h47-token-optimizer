# One-time publish setup

Complete these steps once to enable automated publishing from GitHub Actions.

## 1. NPM (`h47-token-optimizer`)

1. Create/login at [npmjs.com](https://www.npmjs.com/signup) as **wcalmels**.
2. Create an **Automation** access token: npm → Access Tokens → Generate New Token → **Automation**.
3. Add it to GitHub:

   ```powershell
   gh secret set NPM_TOKEN -R wcalmels/h47-token-optimizer
   ```

4. (Recommended) Enable [Trusted Publishers](https://docs.npmjs.com/trusted-publishers) linking this repo’s **Publish to NPM** workflow — allows provenance without long-lived tokens later.

5. Trigger publish:

   ```powershell
   gh workflow run "Publish to NPM" -R wcalmels/h47-token-optimizer
   ```

   Or create a GitHub Release — the workflow runs automatically on `release: published`.

Verify: `npm view h47-token-optimizer`

## 2. VS Code Marketplace

1. Create publisher **wcalmels** at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage).
2. Create Azure DevOps PAT with **Marketplace → Manage** scope.
3. Add secret:

   ```powershell
   gh secret set VSCE_PAT -R wcalmels/h47-token-optimizer
   ```

4. Trigger:

   ```powershell
   gh workflow run "Publish VS Code Extension" -R wcalmels/h47-token-optimizer
   ```

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
