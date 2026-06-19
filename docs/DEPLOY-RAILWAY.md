# Deploy en Railway — prueba antes del VPS

Guía para desplegar **H47 Token Optimizer API** en [Railway](https://railway.app) en ~15 minutos, probar ingresos/uso, y luego migrar a VPS.

**Coste trial:** Railway da ~$5 crédito/mes en plan Hobby. Esta API usa ~512 MB RAM → **~$3–5/mes** en uso ligero.

---

## Qué vas a probar

| Sin pagar aún | Con Stripe test (opcional) |
|---------------|----------------------------|
| API hosted con tu URL pública | Checkout de prueba ($0 real) |
| API keys + límites free/pro | Webhook upgrade automático |
| Medir compresión y latencia | Flujo completo de suscripción |

**No necesitas Stripe** para la primera prueba — solo API keys y monetización activada.

---

## Paso 1 — Generar secretos (local)

```powershell
cd C:\Users\wcalm\OneDrive\Escritorio\h47-token-optimizer
npm run generate-secrets
```

Copia `BOOTSTRAP_API_KEY` y `ADMIN_SECRET` — los usarás en Railway.

---

## Paso 2 — Crear proyecto en Railway

1. Entra en [railway.app](https://railway.app) → **Login with GitHub**
2. **New Project** → **Deploy from GitHub repo**
3. Selecciona **`wcalmels/h47-token-optimizer`**
4. Railway detecta el `Dockerfile` automáticamente (via `railway.toml`)

---

## Paso 3 — Volumen persistente (importante)

Sin volumen, pierdes API keys al reiniciar.

1. En tu servicio → **Settings** → **Volumes**
2. **Add Volume**
   - Mount path: `/app/data`
   - Size: 1 GB (suficiente)

---

## Paso 4 — Variables de entorno

**Variables** → **Raw Editor** → pega (ajusta email y URL):

```env
NODE_ENV=production
MONETIZATION_ENABLED=true
DATA_DIR=/app/data
BOOTSTRAP_PLAN=pro
BOOTSTRAP_EMAIL=tu@email.com
BOOTSTRAP_API_KEY=h47_pega_aqui_el_de_generate-secrets
ADMIN_SECRET=pega_aqui_admin_secret
RATE_LIMIT=300
CORS_ORIGIN=*
```

**APP_URL** — después del primer deploy:
1. **Settings** → **Networking** → **Generate Domain**
2. Copia la URL (ej. `https://h47-token-optimizer-production.up.railway.app`)
3. Añade variable: `APP_URL=https://tu-url.up.railway.app`
4. Redeploy si hace falta

---

## Paso 5 — Deploy y verificar

Railway despliega solo al push. Tras el deploy:

```powershell
# Health
curl https://TU-URL.up.railway.app/health

# Planes
curl https://TU-URL.up.railway.app/api/plans

# Optimizar (usa tu BOOTSTRAP_API_KEY)
curl -X POST https://TU-URL.up.railway.app/api/optimize `
  -H "Authorization: Bearer h47_tu_key" `
  -H "Content-Type: application/json" `
  -d "{\"text\":\"In order to reduce token costs we need to compress long prompts before sending them to Claude or ChatGPT because due to the fact that providers charge per token this saves money.\",\"options\":{\"compressionLevel\":\"balanced\"}}"

# Ver uso
curl https://TU-URL.up.railway.app/api/usage `
  -H "Authorization: Bearer h47_tu_key"
```

Respuesta esperada en `/health`:

```json
{"status":"ok","monetization":true,"stripe":false,"timestamp":"..."}
```

---

## Paso 6 — Probar límites (simular cliente free)

Tu bootstrap key está en plan **pro** — crea una key free para probar límites:

```powershell
curl -X POST https://TU-URL.up.railway.app/api/keys `
  -H "X-Admin-Secret: TU_ADMIN_SECRET" `
  -H "Content-Type: application/json" `
  -d "{\"email\":\"test@local.dev\",\"plan\":\"free\",\"label\":\"trial\"}"
```

Usa la key devuelta — tras 10 optimizaciones/día deberías recibir **402 Payment Required**.

---

## Paso 7 — Stripe test (cuando quieras cobrar)

1. [dashboard.stripe.com](https://dashboard.stripe.com) → modo **Test**
2. Crea productos Pro ($9.99) y Team ($49)
3. Añade en Railway:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...
```

4. Webhook: `https://TU-URL.up.railway.app/api/webhooks/stripe`
   - Eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
5. `STRIPE_WEBHOOK_SECRET=whsec_...`

Probar checkout:

```powershell
curl -X POST https://TU-URL.up.railway.app/api/checkout `
  -H "Content-Type: application/json" `
  -d "{\"planId\":\"pro\",\"email\":\"test@stripe.com\",\"apiKey\":\"h47_key_free_del_paso_6\"}"
```

Abre la URL devuelta → paga con tarjeta test `4242 4242 4242 4242`.

---

## Paso 8 — Conectar extensión VS Code (opcional)

En VS Code Settings (`h47`):

- Futuro: `h47.useHostedApi` — por ahora usa curl o integra en tus scripts con la URL de Railway.

---

## Cuánto puedes ganar (realista en trial)

| Escenario | Ingreso/mes | Coste Railway |
|-----------|------------:|--------------:|
| Solo tú probando | $0 | ~$3–5 |
| 5 clientes Pro | ~$50 | ~$5 |
| 20 clientes Pro | ~$200 | ~$10–15 |

**Margen:** >85% porque no hay coste LLM por compresión.

---

## Migrar a VPS después

Cuando tengas tracción:

1. Exporta `data/billing.json` del volumen Railway
2. Mismo `docker compose` en Hetzner/Contabo ($5/mo)
3. Apunta DNS → VPS
4. Actualiza `APP_URL` y webhook Stripe

Ver [DEPLOY.md](./DEPLOY.md) para VPS.

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| 401 en /api/optimize | Falta header `Authorization: Bearer h47_...` |
| Keys perdidas al redeploy | Monta volumen en `/app/data` |
| Build falla | Revisa logs → `npm run build` debe pasar local |
| Stripe checkout 503 | Faltan `STRIPE_*` vars — normal en trial sin Stripe |

---

## Checklist

- [ ] Repo conectado en Railway
- [ ] Volumen `/app/data`
- [ ] `BOOTSTRAP_API_KEY` + `ADMIN_SECRET` configurados
- [ ] Dominio generado + `APP_URL` set
- [ ] `/health` responde OK
- [ ] `/api/optimize` comprime texto
- [ ] (Opcional) Stripe test + webhook

---

*Copyright © 2024-2026 H47 Team*
