# Publicar en npm (2026) — guía en español

npm **ya no permite tokens Classic** (Automation). Solo **Granular Access Token** o **Trusted Publishing** (recomendado).

---

## Opción A — Trusted Publishing (sin token, recomendado)

Publica desde GitHub Actions con OIDC. No necesitas pegar tokens en el chat.

### 1. Configurar en npmjs.com

1. Entra como **wcalmels** en [npmjs.com](https://www.npmjs.com)
2. Ve a tu paquete **h47-token-optimizer**:
   - [npmjs.com/package/h47-token-optimizer](https://www.npmjs.com/package/h47-token-optimizer) → **Settings**
   - Si no ves el paquete, créalo/resérvalo desde el panel de paquetes
3. Busca la sección **Trusted Publisher**
4. Elige **GitHub Actions** y completa:
   - **Repository:** `wcalmels/h47-token-optimizer`
   - **Workflow filename:** `publish.yml` (solo el nombre del archivo)
5. Guarda

### 2. Publicar desde GitHub

```powershell
gh workflow run "Publish to NPM" -R wcalmels/h47-token-optimizer
```

El workflow ya usa Node 22 y permisos OIDC (`id-token: write`).

### 3. Verificar

```bash
npm view h47-token-optimizer
```

---

## Opción B — Token Granular (si no usas Trusted Publishing)

npm te redirige a Granular — es normal. Lo importante es marcar **Bypass 2FA**.

### Pasos exactos

1. [npmjs.com/settings/wcalmels/tokens](https://www.npmjs.com/settings/wcalmels/tokens)
2. **Generate New Token** → **Granular Access Token**
3. **Token name:** `h47-publish`
4. **Expiration:** 90 días (máximo)
5. **Packages and scopes:** **Read and write**
6. **Select packages:** `h47-token-optimizer` (o *All packages*)
7. **Desplázate hasta el final** de la página
8. Activa: **Allow this token to bypass two-factor authentication (2FA)**
   - Sin esta casilla → error `403 Two-factor authentication...`
9. **Generate Token** → copia `npm_...` (solo se muestra una vez)

### Guardar en GitHub

```powershell
gh secret set NPM_TOKEN -R wcalmels/h47-token-optimizer
gh workflow run "Publish to NPM" -R wcalmels/h47-token-optimizer
```

---

## Si no ves "Bypass 2FA"

- Solo aparece cuando el token tiene permiso **Read and write**
- Está **al final** del formulario (hay que hacer scroll)
- Si el paquete tiene **"Require 2FA and disallow tokens"**, los tokens no sirven → usa **Opción A (Trusted Publishing)**

---

## Publicación manual con OTP (una vez)

Si tienes app de autenticación (Google Authenticator, etc.):

```bash
npm publish --access public --otp=123456
```

Reemplaza `123456` con el código de 6 dígitos actual. No sirve para CI automático.

---

## Si publicaste pero `npm install` da 404

npm puede usar **staged publishing**: el paquete se sube pero no es público hasta que lo apruebes.

1. Entra en [npmjs.com](https://www.npmjs.com) → **Packages** → `@wcalmels/h47-token-optimizer`
2. Busca **Staged** / **Pending approval** / **Approve release**
3. Aprueba con tu 2FA (app o passkey)
4. Espera 2–5 minutos y verifica:

```bash
npm view @wcalmels/h47-token-optimizer
npm install @wcalmels/h47-token-optimizer
```

---

## Errores comunes

| Error | Causa | Solución |
|-------|-------|----------|
| `403 Two-factor authentication...` | Token sin Bypass 2FA | Opción A o token con Bypass 2FA |
| `403 You may not perform that action` | Token solo lectura | Read and write |
| `403 disallow tokens` | Paquete bloquea tokens | Trusted Publishing |
