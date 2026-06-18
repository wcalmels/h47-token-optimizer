# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 1.0.x   | Yes       |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Email: security@h47.ai (or open a private security advisory on GitHub if enabled).

Include:
- Description of the issue
- Steps to reproduce
- Impact assessment
- Suggested fix (if any)

We aim to acknowledge reports within **72 hours** and provide a fix timeline within **7 days** for confirmed critical issues.

## Scope

In scope:
- REST API (`src/api/`) — injection, DoS, auth bypass
- CLI input handling
- Dependency vulnerabilities in production dependencies

Out of scope:
- Denial of service via intentionally large prompts (mitigated by `express.json` limit; use rate limiting in production)
- Social engineering
- Issues in third-party AI provider APIs

## Recommendations for self-hosters

1. Run behind a reverse proxy with TLS.
2. Set `RATE_LIMIT` appropriately for your traffic.
3. Do not expose the API to the public internet without authentication (not included in v1.0.0).
4. Keep dependencies updated: `npm audit`.
