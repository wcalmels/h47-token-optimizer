# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Task-level quality evaluation (downstream success rate)
- Optional tiktoken integration for accurate budgets
- Web dashboard
- API authentication for self-hosted deployments

## [1.0.1] - 2026-06-19

### Changed
- Published to npm as `@wcalmels/h47-token-optimizer` (scoped package; unscoped name reserved as private on npm)

## [1.0.0] - 2024-01-15

### Added
- Core pipeline: spike extraction → synthesis → prioritization → multi-AI adaptation
- CLI (`h47-optimize`), REST API, VS Code / Cursor / Claude extensions
- Benchmark suite with CSV export, baseline comparison, CI integration
- Documentation: architecture, limitations, business viability analysis
- MIT license, NOTICE, CITATION.cff, SECURITY.md, CODE_OF_CONDUCT.md

### Notes
- Quality metric is heuristic — see docs/LIMITATIONS.md
- Compression effective on long/repetitive inputs; minimal on short prompts

---

Copyright © 2024-2026 H47 Team
