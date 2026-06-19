# One-time publish setup

Complete these steps once to enable automated publishing from GitHub Actions.

## 1. NPM (`h47-token-optimizer`)

1. Create/login at [npmjs.com](https://www.npmjs.com/signup) as **wcalmels**.
2. Create a token with **Read and Write** permissions (not read-only):
   - npm → Access Tokens → **Granular Access Token**
   - Permissions: **Packages and scopes → Read and write**
   - Or use a classic **Automation** token with publish rights
3. Add it to GitHub:

   ```powershell
   gh secret set NPM_TOKEN -R wcalmels/h47-token-optimizer
   ```

4. **Important:** If you reserved `h47-token-optimizer` or `@wcalmels/h47-token-optimizer` as **private** placeholders on npm, your token must be able to **publish** to them (read-only tokens fail with `403 Forbidden`).

5. Trigger publish:

   ```powershell
   gh workflow run "Publish to NPM" -R wcalmels/h47-token-optimizer
   ```

Verify: `npm view h47-token-optimizer`

## 2. VS Code Marketplace

1. Create publisher **wcalmels** at [marketplace.visualstudio.com/manage](https://marketplace.visualstudio.com/manage).
2. Create Azure DevOps PAT with **Marketplace → Publish** scope (Manage alone is not enough for `vsce publish`).
3. Add secret:

   ```powershell
   gh secret set VSCE_PAT -R wcalmels/h47-token-optimizer
   ```

4. Verify locally before CI:

   ```powershell
   $env:VSCE_PAT = "YOUR_PAT"
   npx vsce verify-pat
   cd extensions/vscode
   npx vsce publish --no-dependencies -p $env:VSCE_PAT
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
