# Qadam ENT security audit — 2026-08-09

## Scope

Reviewed the current Vue/Vite frontend, Spring Boot API, PostgreSQL/Flyway schema, Telegram OTP/session flow, Netlify proxy/deployment, Docker Compose, GitHub Actions, dependency update configuration, browser persistence, and repository security settings.

## Executive summary

The most serious application-level findings from the initial review were already addressed by the merged production-readiness work: server-side authorization is active, OTP/session hashes use HMAC-SHA256 with a server-side pepper, OTP consumption is atomic, production configuration is validated at startup, and backend integration/container gates exist.

This follow-up branch applies the remaining non-breaking hardening that is safe to layer on top of the current architecture. The largest residual risk is repository governance: `main` is currently unprotected and does not require CI checks before changes can land.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | Backend previously allowed all requests through Spring Security | Fixed in merged production-readiness changes |
| High | Low-entropy OTP/session material previously lacked keyed hashing and atomic OTP consumption | Fixed in merged production-readiness changes |
| High | `main` branch has no branch protection or required status checks | Open — repository setting |
| High | Spring Boot was pinned to 3.5.5 while patched 3.5.x releases are available | Fixed in this branch: 3.5.16 |
| Medium | Backend configuration defaulted to development, insecure cookie defaults, development pepper, and Swagger enabled | Fixed in this branch with fail-closed defaults |
| Medium | Authenticated user PII was redundantly persisted in browser `localStorage` | Fixed in this branch; legacy value is removed |
| Medium | Netlify static responses lacked baseline anti-clickjacking/MIME/referrer/permissions headers | Fixed in this branch |
| Medium | Production deploy used floating `netlify-cli@latest` | Fixed in this branch: exact CLI version pinned |
| Medium | Backend GitHub Actions used floating major tags | Fixed in this branch with commit SHA pinning |
| Medium | Gradle dependencies were not covered by Dependabot update configuration | Fixed in this branch |
| Medium | Dependabot security alerts are disabled in repository settings | Open — repository setting |
| Medium | OTP rate limiting is phone-based only; no trusted edge/IP/global abuse limit | Open |
| Medium | Guest diagnostic submission is intentionally public and can be abused for database-write amplification | Open — add edge/application rate limiting without removing guest flow |
| Medium | Expired OTP/session records do not have an explicit scheduled retention cleanup job | Open |
| Low | Local PostgreSQL port was exposed on all host interfaces | Fixed in this branch: loopback-only bind |
| Low | OTP verification request ID had no explicit request-size bound | Fixed in this branch |
| Low/conditional | CSRF is disabled | Accepted for current JSON/same-origin/SameSite design; revisit if cookie or mutation model changes |
| Unknown | Secret-scanning alerts | Could not verify: current GitHub integration lacks permission |

## Positive controls verified

- Protected backend routes use server-side Spring Security authentication rather than Vue router state.
- Session cookies are HttpOnly and configurable as Secure/SameSite.
- Session tokens are high entropy; stored token/OTP representations are keyed HMAC hashes rather than plaintext.
- OTP requests have per-phone recent/hourly/daily limits and bounded attempts.
- OTP successful consumption is atomic.
- SQL access uses parameter binding rather than query string concatenation in reviewed flows.
- CORS is restricted to configured frontend origins.
- Netlify provides a same-origin `/api` proxy instead of exposing cross-origin browser credentials by default.
- API errors are configured not to expose stack traces/messages in production responses.
- Flyway migrations are validated and destructive clean is disabled.
- Backend CI includes tests, packaging, and a production Docker image build.
- Frontend CI includes dependency audit, formatting, lint, types, tests, proxy syntax, and production build.
- No reviewed source usage of `v-html`, `innerHTML`, `eval()`, or manual `document.cookie` access was found.
- Quick repository searches did not find `ghp_` tokens or committed `BEGIN PRIVATE KEY` material; this is not a substitute for GitHub secret scanning.

## Recommended next actions

1. Protect `main`: require pull requests and successful frontend/backend CI checks; disable direct pushes except deliberate emergency bypass.
2. Enable GitHub Dependabot security alerts and secret scanning/push protection where available.
3. Add trusted edge/application rate limits for OTP endpoints and public diagnostic submissions (IP/device/global + existing phone limits).
4. Add scheduled cleanup/retention for expired OTP requests, expired/revoked sessions, and other transient auth data.
5. Add security integration tests for OTP abuse limits, duplicate verification, production startup validation, cookie attributes, CORS, and anonymous/authenticated route boundaries.
6. Add a tested Content-Security-Policy after inventorying required script/style/font origins.
7. Revisit CSRF protection if cookies ever use `SameSite=None`, if simple-form authenticated mutations are introduced, or if the same-origin proxy model changes.

## Merge criteria for this hardening branch

- Frontend quality gate passes.
- Backend Spring Boot quality gate passes.
- Production Docker image build passes.
- No intentional guest diagnostic behavior is removed.
- No secrets are added to repository files.
