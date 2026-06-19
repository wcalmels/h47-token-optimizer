# H47 Token Optimizer — Monetizable Production Deploy

Deploy the **hosted API** with API keys, usage quotas, and Stripe subscriptions.

## Architecture

```
Client → HTTPS → API (Docker) → billing.json (volume)
                      ↓
                   Stripe webhooks → upgrade plan
```

| Layer | Free (OSS) | Paid (hosted) |
|-------|------------|---------------|
| npm library / CLI | ✓ | — |
| Self-hosted API | ✓ open | — |
| Hosted API + keys | — | ✓ |
| Stripe billing | — | ✓ |

## Plans (default)

| Plan | Price | Daily opts | Monthly tokens |
|------|------:|----------:|---------------:|
| Free | $0 | 10 | 100K |
| Pro | $9.99/mo | 1,000 | 5M |
| Team | $49/mo | 10,000 | 50M |

Configure Stripe Price IDs in `.env.production`.

---

## 1. Stripe setup

1. [dashboard.stripe.com](https://dashboard.stripe.com) → **Products**
2. Create **Pro** ($9.99/month) and **Team** ($49/month) recurring prices
3. Copy Price IDs → `STRIPE_PRICE_PRO`, `STRIPE_PRICE_TEAM`
4. **Developers → API keys** → `STRIPE_SECRET_KEY`
5. **Webhooks** → endpoint `https://api.tudominio.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## 2. Generate secrets

```bash
# API key for your first customer (you)
node scripts/create-api-key.mjs --plan pro --email you@example.com

# Random admin secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 3. Deploy with Docker

```bash
cp .env.production.example .env.production
# Edit .env.production

docker compose up -d --build
```

Verify:

```bash
curl https://api.tudominio.com/health
curl https://api.tudominio.com/api/plans
```

---

## 4. API usage (customers)

```bash
curl -X POST https://api.tudominio.com/api/optimize \
  -H "Authorization: Bearer h47_..." \
  -H "Content-Type: application/json" \
  -d '{"text":"Long prompt...","options":{"compressionLevel":"balanced"}}'
```

Check usage:

```bash
curl https://api.tudominio.com/api/usage \
  -H "Authorization: Bearer h47_..."
```

Upgrade (returns Stripe Checkout URL):

```bash
curl -X POST https://api.tudominio.com/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"planId":"pro","email":"customer@company.com","apiKey":"h47_..."}'
```

---

## 5. Create API keys (admin)

```bash
curl -X POST https://api.tudominio.com/api/keys \
  -H "X-Admin-Secret: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"client@corp.com","plan":"team","label":"acme-corp"}'
```

---

## 6. Deploy targets

| Platform | Notes |
|----------|-------|
| **Railway / Render / Fly.io** | Docker deploy + volume for `/app/data` |
| **VPS (Hetzner $5)** | `docker compose` + Caddy/Traefik TLS |
| **AWS ECS** | EFS volume for `DATA_DIR` |

Minimum: 512 MB RAM, 1 vCPU. Cost ~$5–20/mo → break-even at ~5 Pro subscribers.

---

## 7. Revenue flow

1. User installs VS Code extension (free) → discovers hosted API
2. Free tier: 10 opts/day → hits limit
3. `POST /api/checkout` → Stripe → webhook upgrades key to Pro
4. You keep ~90%+ margin (CPU-only, no LLM cost)

---

## Environment reference

See [.env.production.example](../.env.production.example).

---

*Copyright © 2024-2026 H47 Team*
