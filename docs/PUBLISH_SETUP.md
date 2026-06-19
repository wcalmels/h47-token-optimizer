# One-time publish setup

Complete these steps once to enable automated publishing from GitHub Actions.

## 1. NPM (`h47-token-optimizer`) — pending

The VS Code extension is live. NPM still needs a **read-write** token (the previous one was read-only → `403 Forbidden`).

### Create the token (exact steps)

1. Login at [npmjs.com](https://www.npmjs.com) as **wcalmels**
2. Avatar → **Access Tokens** → **Generate New Token** → **Granular Access Token**
3. Configure:
   - **Token name:** `h47-github-publish`
   - **Expiration:** 90 days (or custom)
   - **Packages and scopes:** select **Read and write**
   - **Select packages:** choose `h47-token-optimizer` (and `@wcalmels/h47-token-optimizer` if listed)
   - **Bypass 2FA:** enable if your npm account uses two-factor authentication (required for `npm publish`)
4. **Generate token** → copy it once (starts with `npm_`)

> **If publish fails with 2FA:** use a classic **Automation** token instead (npm → Access Tokens → Generate New Token → **Classic Token** → **Automation**). Automation tokens can publish without OTP when 2FA is enabled on your account.

### Publish

```powershell
gh secret set NPM_TOKEN -R wcalmels/h47-token-optimizer
gh workflow run "Publish to NPM" -R wcalmels/h47-token-optimizer
```

Verify:

```bash
npm view h47-token-optimizer
npm install h47-token-optimizer
npx h47-optimize "test prompt"
```

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
