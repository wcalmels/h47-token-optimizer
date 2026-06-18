# Business viability

This is an honest economic analysis of H47 Token Optimizer as a product — not a pitch deck.

**Short answer:** the *technology* is cheap to run and can be profitable; the *market* is competitive and the moat is thin unless you pair compression with distribution, vertical focus, or workflow lock-in.

---

## Unit economics (favorable)

| Cost driver        | H47                          | LLM-based compression      |
|--------------------|------------------------------|----------------------------|
| Compute per call   | ~1–15 ms CPU                 | 500 ms–5 s + API cost      |
| Marginal cost      | ≈ $0                         | $0.001–$0.05 per request   |
| Infrastructure     | Single Node process          | GPU / external API         |
| Scales with        | Input size (linear)          | Input + output tokens      |

At scale, serving 1M optimizations/month on a $40/month VPS is technically feasible. **Gross margin on a hosted API can exceed 90%** if you charge for convenience, SLAs, and integrations — not for the algorithm itself.

---

## Where revenue can work

### 1. B2B infrastructure (best fit)

**Buyer:** engineering teams with large LLM bills (>$2k/month).

**Value prop:** deterministic pre-processing pipeline integrated into CI, logging, or agent frameworks — measurable token savings without an extra LLM call.

**Pricing model:** usage-based API ($0.50–$2 per 1M tokens processed) or seat-based ($29–99/dev/month).

**Why it works:** buyers already track token spend; savings are auditable.

### 2. Vertical SaaS wrapper (strong moat)

Wrap the engine for one industry:

- **Legal:** compress discovery documents before review prompts
- **DevOps:** compress incident logs before on-call copilots
- **Support:** compress ticket history before agent handoff

The moat is workflow integration + compliance story, not the compressor.

### 3. Open-core (matches this repo)

| Tier        | Offering                                      |
|-------------|-----------------------------------------------|
| MIT (free)  | Core library, CLI, self-hosted API            |
| Pro         | Hosted API, analytics dashboard, team seats   |
| Enterprise  | SSO, audit logs, on-prem, custom compression  |

Karpathy-style open source builds trust and adoption; revenue comes from ops-heavy layers.

### 4. IDE / platform partnerships

Distribution through Cursor, VS Code marketplace, or Claude plugin stores. Revenue share or premium extension listing.

---

## Where revenue is hard

### Consumer SaaS at $9.99/month

Weak unless bundled. Individual developers can `npm install` and self-host for free. Churn will be high.

### "70–90% compression" as the only selling point

Providers are actively improving context windows and caching. Compression-as-feature commoditizes quickly.

### Quality claims without task-level benchmarks

Enterprise buyers will ask: *"Does my agent still work?"* Heuristic quality scores are not enough for procurement.

---

## Competitive landscape

| Alternative                    | Trade-off vs H47                          |
|--------------------------------|-------------------------------------------|
| Truncate / chop context        | Free, dumb, fast — H47 is smarter         |
| LLM summarization              | Higher quality, 100× cost, non-deterministic|
| Provider prompt caching        | Zero code, vendor lock-in, not compression|
| RAG / chunk retrieval          | Better for KB, not live prompt compression|
| tiktoken + manual budgeting    | Full control, no automation               |

**Differentiation that survives:** deterministic, local, auditable, no inference tax, reproducible benchmarks.

---

## Is it profitable? (decision matrix)

| Scenario                                      | Verdict        |
|-----------------------------------------------|----------------|
| Solo dev, MIT only, no GTM                    | **Not a business** — fine as OSS portfolio |
| Hosted API + 50 paying teams @ $49/mo          | **~$29k ARR** — viable side business       |
| Enterprise vertical (legal/devops) + services | **$100k+ ARR** — viable if sales exist     |
| Consumer subscription alone                   | **Unlikely** without brand or bundling     |
| Acqui-hire / infra component inside platform  | **Possible** — realistic exit for OSS tool |

### Break-even sketch (hosted API)

```
Fixed costs:   $200/mo  (VPS, monitoring, domain)
Variable:      ~$0.001 per 1k optimizations (negligible)
Break-even:    5 teams × $49/mo = $245/mo
```

The model is **rentable** because marginal cost ≈ 0. The constraint is **customer acquisition**, not COGS.

---

## Recommendations

1. **Keep the core MIT** — adoption is the asset.
2. **Monetize hosted + enterprise ops** — auth, audit, dashboard, SLAs.
3. **Pick one vertical** — prove task-level quality there with real benchmarks.
4. **Replace heuristic quality** with downstream task success rate before enterprise sales.
5. **Do not over-promise** — publish [LIMITATIONS.md](./LIMITATIONS.md) prominently.

---

## Summary

| Question                         | Answer                                      |
|----------------------------------|---------------------------------------------|
| Is the engine cheap to run?      | Yes — CPU-only, sub-15 ms typical           |
| Is there market demand?          | Yes — token costs are real and growing      |
| Is the moat strong alone?        | No — needs distribution or vertical focus   |
| Can it be a profitable business? | **Yes, conditionally** — B2B/enterprise, not consumer |
| Best analogy                     | `gzip` for LLM prompts — essential utility, not magic |

---

*Copyright © 2024-2026 H47 Team. This analysis is opinion, not financial advice.*
