# H47 Token Optimizer

[![CI/CD](https://github.com/wcalmels/h47-token-optimizer/actions/workflows/ci.yml/badge.svg)](https://github.com/wcalmels/h47-token-optimizer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/github/license/wcalmels/h47-token-optimizer)](https://github.com/wcalmels/h47-token-optimizer/blob/main/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-18%20|%2020-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub release](https://img.shields.io/github/v/release/wcalmels/h47-token-optimizer?include_prereleases)](https://github.com/wcalmels/h47-token-optimizer/releases)
[![Discussions](https://img.shields.io/github/discussions/wcalmels/h47-token-optimizer)](https://github.com/wcalmels/h47-token-optimizer/discussions)

Deterministic, local compression for LLM prompts. No inference required.

Given a long prompt, the pipeline extracts salient sentences, synthesizes a shorter version, enforces a token budget, and adapts formatting for Claude, GPT, Cursor, or generic models. Typical latency: **1–15 ms**. Typical compression on repetitive/long inputs: **70–97%** (see benchmarks below).

> **Scope.** This is extractive compression, not abstractive summarization. It works well on logs, code, and repetitive prose. It is not a substitute for task-level evaluation on your data. Read [docs/LIMITATIONS.md](docs/LIMITATIONS.md) before production use.

---

## Quick start

```bash
git clone https://github.com/wcalmels/h47-token-optimizer
cd h47-token-optimizer
npm install && npm run build

# CLI
npx h47-optimize "Your long prompt here..."
npx h47-optimize stats

# API
npm run dev
curl -s -X POST http://localhost:3001/api/optimize \
  -H "Content-Type: application/json" \
  -d '{"text":"Your prompt...","options":{"compressionLevel":"balanced"}}'
```

```typescript
import { H47TokenOptimizer } from 'h47-token-optimizer';

const optimizer = new H47TokenOptimizer();
const result = await optimizer.optimize(longText, {
  targetAI: 'claude',
  compressionLevel: 'balanced',
  maxTokens: 2000,
});

console.log(result.metrics.compression, result.optimized.text);
```

---

## How it works

```
prompt → spike extract → synthesize → prioritize → adapt → compressed prompt
```

Four pure stages, no network calls. Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

| Stage | What it does |
|-------|--------------|
| SpikeExtractor | Keeps sentences with highest keyword salience |
| ContextSynthesizer | Dedup, phrase shortening, abbreviation |
| TokenPrioritizer | Enforces `maxTokens` budget |
| MultiAIAdapter | Model-specific prefix/suffix formatting |

Compression levels:

| Level | Sentence retention | Intended use |
|-------|-------------------|--------------|
| `conservative` | ~70% | Legal, compliance, high-stakes |
| `balanced` | ~45% | General purpose (default) |
| `aggressive` | ~25% | Logs, code, exploration |

---

## Benchmarks (reproducible)

All numbers below come from `npm run benchmark:quick` on the committed baseline. Reproduce locally:

```bash
npm run benchmark          # full (~50 iter/scenario)
npm run benchmark:quick    # fast (~10 iter)
npm run benchmark:csv      # export CSV + JSON
npm run benchmark:compare  # diff vs benchmarks/baseline.json
```

**Measured results** (v1.0.0, Node 20+, quick mode):

| Scenario | Input tokens | Output tokens | Compression | Latency (avg) |
|----------|-------------:|--------------:|------------:|--------------:|
| Long conversation | 4,698 | 1,215 | 74% | 1.8 ms |
| Code analysis (500 fn) | 31,446 | 1,210 | 96% | 11.6 ms |
| Structured logs (1k lines) | 34,170 | 2,000 | 94% | 5.0 ms |
| Legal document | 3,623 | 96 | 97% | 0.9 ms |
| Short prompt | 33 | 33 | 0% | 0.1 ms |

Short prompts do not compress — by design. Do not expect savings on inputs already under ~200 tokens.

CI runs benchmarks on every push and fails on compression/quality regressions. See [.github/workflows/ci.yml](.github/workflows/ci.yml).

---

## Project layout

```
h47-token-optimizer/
├── src/
│   ├── core/           # compression pipeline
│   ├── api/            # Express REST server
│   ├── cli/            # h47-optimize binary
│   ├── benchmarks/     # perf suite + compare
│   └── extensions/     # vscode, cursor, claude
├── tests/
├── benchmarks/         # baseline.json (committed), CI artifacts
├── docs/
│   ├── ARCHITECTURE.md
│   ├── LIMITATIONS.md
│   └── BUSINESS.md     # viability analysis
├── LICENSE             # MIT
├── NOTICE              # copyright + third-party
└── CITATION.cff
```

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/optimize` | Optimize single prompt |
| `POST` | `/api/batch` | Batch optimize |
| `GET` | `/api/stats` | Version and capabilities |
| `POST` | `/api/optimize-for-ai` | Optimize for specific model |
| `GET` | `/health` | Health check |

Environment: `PORT`, `RATE_LIMIT` (default 100 req/min/IP). See [.env.example](.env.example).

---

## Is this a viable business?

**Conditionally yes** — as B2B infrastructure or vertical SaaS, not as a standalone consumer app.

- Marginal cost ≈ **$0** (CPU-only, no LLM calls to compress)
- Gross margin on hosted API can exceed **90%**
- Moat is thin without distribution, vertical focus, or workflow integration
- Open-core (MIT library + paid hosted/enterprise) is the natural model

Full analysis: **[docs/BUSINESS.md](docs/BUSINESS.md)**  
**Try on Railway (15 min):** **[docs/DEPLOY-RAILWAY.md](docs/DEPLOY-RAILWAY.md)**  
**VPS / production:** **[docs/DEPLOY.md](docs/DEPLOY.md)**

### Monetized hosted API (quick start)

```bash
cp .env.production.example .env.production
# Configure STRIPE_* keys + BOOTSTRAP_API_KEY

docker compose up -d --build

# Create customer API keys
npm run create-key -- --plan pro --email client@corp.com
```

| Endpoint | Purpose |
|----------|---------|
| `GET /api/plans` | Public pricing |
| `POST /api/checkout` | Stripe subscription URL |
| `GET /api/usage` | Usage vs limits (Bearer token) |
| `POST /api/optimize` | Requires `Authorization: Bearer h47_...` when monetization enabled |

---

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
npm test && npm run lint && npm run type-check && npm run benchmark:compare
```

---

## Citation

If you use this in research or a product, cite:

```bibtex
@software{h47_token_optimizer,
  title  = {H47 Token Optimizer: a deterministic pipeline for LLM context compression},
  author = {wcalmels}},
  year   = {2026},
  url    = {https://github.com/wcalmels/h47-token-optimizer},
  license = {MIT}
}
```

Or use [CITATION.cff](CITATION.cff) for automated citation tools.

---

## License & copyright

Copyright © 2025-2026 H47 Team · [wcalmels](https://github.com/wcalmels). Released under the [MIT License](LICENSE).

See [NOTICE](NOTICE) for third-party attributions.

---

## Links

- [Architecture](docs/ARCHITECTURE.md)
- [Limitations](docs/LIMITATIONS.md) — read before production
- [Business viability](docs/BUSINESS.md)
- [VS Code Marketplace](docs/MARKETPLACE.md) — publish the extension
- [Changelog](CHANGELOG.md)
- [Security policy](SECURITY.md)

## VS Code / Cursor Extension

```bash
npm run extension:pack   # → extensions/vscode/h47-token-optimizer-1.0.0.vsix
```

Install in VS Code or Cursor: **Extensions → … → Install from VSIX**.

Publish to Marketplace: see [docs/MARKETPLACE.md](docs/MARKETPLACE.md).
