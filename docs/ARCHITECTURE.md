# Architecture

This document describes how H47 Token Optimizer works. The design favors **determinism, inspectability, and zero external inference cost** over black-box compression.

## Problem statement

Given a text prompt `T` with estimated token count `|T|`, produce `T'` such that:

1. `|T'| << |T|` (compression)
2. Task-relevant information in `T` is preserved in `T'` (quality)
3. `T'` is formatted for a target model `M ∈ {claude, gpt, cursor, generic}`

There is no free lunch: aggressive compression necessarily discards information. The pipeline exposes this trade-off via explicit compression levels rather than hiding it.

## Pipeline

```
T  ──► [1. SpikeExtractor]     ──► spikes[]     (sentence-level salience)
     ──► [2. ContextSynthesizer] ──► text₁       (dedup, phrase compression)
     ──► [3. TokenPrioritizer]   ──► text₂       (budget enforcement)
     ──► [4. MultiAIAdapter]     ──► T'          (model-specific formatting)
```

Each stage is pure (no I/O, no network, no randomness). Same input + options → same output.

### Stage 1: Spike extraction

**Input:** raw text `T`, compression level `L`

**Method:**
- Split into sentences.
- Score words by frequency (length ≥ 5, stop-word filtered).
- Rank sentences by keyword overlap + positional boost (first/last sentences weighted).
- Keep top `⌈n · r(L)⌉` sentences, where `n` = sentence count and `r(L)` is the level ratio:
  - conservative: 0.70
  - balanced: 0.45
  - aggressive: 0.25

**Complexity:** O(|T|) time, O(|T|) space.

### Stage 2: Context synthesis

**Input:** spike sentences

**Method:**
- Join with minimal punctuation.
- Remove duplicate sentences (case-normalized).
- Replace verbose phrases (`in order to` → `to`, etc.).
- Abbreviate common locutions (`for example` → `e.g.`).

**Complexity:** O(|T|) time.

### Stage 3: Token prioritization

**Input:** synthesized text, budget `B` tokens

**Method:**
- If `estimate(text) ≤ B · m(L)`, return as-is (`m` = level multiplier).
- Otherwise truncate with 60/40 head/tail split to preserve opening context and recent details.

**Token estimate:** `max(⌈chars/4⌉, ⌈1.3 · words⌉)` — a fast heuristic, not a tokenizer.

### Stage 4: Multi-AI adaptation

Lightweight suffix/prefix formatting per target. No semantic rewriting.

| Target  | Adaptation                          |
|---------|-------------------------------------|
| claude  | Append concise-response instruction |
| gpt     | Append direct-response suffix       |
| cursor  | Wrap code-like content in fences    |
| generic | Passthrough                         |

## Quality metric (important caveat)

The reported `quality` score is a **retention heuristic** based on length ratio, not a measured downstream task success rate:

```
retention = |T'| / |T|
quality ≈ f(retention)   // piecewise mapping to [0.85, 0.98]
```

Do not treat this as an empirical guarantee. Validate on your task. See [LIMITATIONS.md](./LIMITATIONS.md).

## Interfaces

| Surface    | Entry point                          |
|------------|--------------------------------------|
| Library    | `H47TokenOptimizer.optimize()`       |
| CLI        | `h47-optimize`                       |
| REST API   | `POST /api/optimize`                 |
| Benchmarks | `npm run benchmark`                  |

## Design principles

1. **No inference tax** — compression runs locally in milliseconds; it never calls an LLM to compress an LLM prompt.
2. **Explicit trade-offs** — three compression levels with documented intent.
3. **Reproducible benchmarks** — committed baseline, CSV export, CI regression checks.
4. **Small surface area** — ~800 lines of core logic; readable in one sitting.

## File map

```
src/core/
  tokenOptimizer.ts      orchestrator
  spikeExtractor.ts      stage 1
  contextSynthesizer.ts  stage 2
  tokenPrioritizer.ts    stage 3
  multiAIAdapter.ts      stage 4
  tokenUtils.ts          shared estimates + level config
```
