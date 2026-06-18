# Contributing

Thank you for contributing. This project values **correctness, reproducibility, and honest documentation** over marketing claims.

## Before you start

1. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — understand the pipeline.
2. Read [docs/LIMITATIONS.md](docs/LIMITATIONS.md) — know what we do not claim.
3. Open an issue for large changes before writing code.

## Setup

```bash
git clone https://github.com/wcalmels/h47-token-optimizer
cd h47-token-optimizer
npm install
npm run build
```

## Development loop

```bash
npm run dev          # API server with hot reload
npm run cli -- "..."  # CLI
npm test             # unit tests
npm run lint
npm run type-check
npm run benchmark:compare   # if you touched src/core/
```

## Pull request guidelines

1. **One concern per PR** — easier to review.
2. **Tests required** for core logic changes.
3. **Benchmarks** — run `npm run benchmark:compare`. If metrics shift intentionally, update `benchmarks/baseline.json` and explain why in the PR.
4. **No inflated claims** — do not update README with unmeasured compression/quality numbers.
5. **Copyright** — new source files should include:

   ```typescript
   /**
    * Copyright (c) 2024-2026 H47 Team
    * SPDX-License-Identifier: MIT
    */
   ```

## Code style

- TypeScript strict mode
- Match existing naming and file structure
- Prefer simple, readable code over clever abstractions
- Comments only for non-obvious logic

## Commit messages

Use imperative mood, concise:

```
fix: handle empty input in spike extractor
feat: add tiktoken adapter for accurate budgets
docs: clarify quality metric is heuristic
bench: update baseline after prioritizer change
```

## Code of Conduct

See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## Questions

Open a GitHub Discussion or issue.
