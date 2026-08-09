# Qadam security audit — 2026-08-09

## Scope

Reviewed the Vue/Vite frontend, Spring Boot API, PostgreSQL schema, authentication flow, deployment workflows, dependency management, browser storage, and repository security configuration.

## Executive summary

The highest-risk issue was missing server-side authorization: Spring Security allowed every request and relied on the frontend router as the effective access boundary. The authentication flow also stored low-entropy OTP hashes with plain SHA-256 and allowed a race between concurrent verification requests. These issues are addressed in PR #19.

The branch also applies fail-safe production defaults, reduces retained browser PII, restricts local database exposure, upgrades Spring Boot, adds backend CI, and hardens deployment supply-chain configuration.

One high-severity frontend dependency advisory remains open because the patched Nano ID 3.x version referenced by npm audit is not yet available from the configured npm registry. The audit gate remains enabled rather than suppressing the finding.

## Findings

| Severity | Finding | Status |
| --- | --- | --- |
| Critical | All backend routes were allowed by Spring Security (`anyRequest().permitAll()`) | Fixed |
| High | 6-digit OTP values were stored as unsalted SHA-256 hashes | Fixed with bcrypt |
| High | Concurrent OTP verification could bypass the intended attempt/one-time-use checks | Fixed with row locking |
| High | Production could silently inherit development auth mode and insecure cookies | Fixed with fail-safe production defaults |
| High | Spring Boot 3.5.5 was behind the current patched 3.5.x release | Fixed: 3.5.16 |
| High | Frontend dependency audit reports vulnerable `nanoid 3.3.16` through PostCSS | Open/upstream patch availability |
| High | A workflow with `contents: write` used floating GitHub Action tags | Fixed with commit SHA pinning |
| Medium | Authenticated user PII was redundantly persisted in localStorage | Fixed; legacy key is cleared |
| Medium | Local PostgreSQL listened on all host interfaces with a trivial development password | Fixed: loopback-only bind; password can be overridden |
| Medium | Netlify response configuration lacked baseline anti-clickjacking/MIME/referrer headers | Fixed |
| Medium | Backend had no CI compile/test job | Fixed |
| Medium | Gradle dependencies were absent from Dependabot update configuration | Fixed |
| Medium | CSRF protection is disabled | Open; mitigated by SameSite=Lax, JSON API, and exact-origin credentialed CORS |
| Medium | OTP throttling is phone-based only; no trusted edge/IP/device throttle | Open |
| Medium | Expired OTP/session records have no scheduled retention cleanup | Open |
| Medium | Dependabot security alerts are disabled in repository settings | Open; enable in GitHub settings |
| Low | Swagger/OpenAPI could be exposed by default | Fixed: disabled by default, enabled only explicitly/local profile |
| Low | Development OTP values were logged at INFO | Fixed: DEBUG only |

## Positive controls already present

- Session tokens are sent as HttpOnly cookies rather than returned to JavaScript.
- Session tokens are high entropy and only their SHA-256 hashes are stored in PostgreSQL.
- SQL uses bound/named parameters rather than string concatenation.
- CORS is restricted to the configured frontend origin and uses credentialed requests intentionally.
- `.env`, private keys, and PEM files are ignored by Git.
- Vue code does not use `v-html`, `innerHTML`, `eval()`, or manual `document.cookie` access in the reviewed codebase.
- Frontend CI already includes lint, type checks, tests, build, and npm audit.

## Remaining actions before production

1. Keep `npm audit` failing until the Nano ID advisory can be resolved with an actually published compatible patch; do not add an audit exception merely to make CI green.
2. Enable GitHub Dependabot security alerts and secret scanning for the repository/account plan where available.
3. Add rate limiting at the trusted reverse proxy/edge for OTP request and verification endpoints, keyed by client IP/device plus phone.
4. Add scheduled retention cleanup for expired OTP requests, revoked/expired sessions, and other short-lived authentication data.
5. Add integration tests covering anonymous access, authenticated access, OTP attempt limits, concurrent verification, cookie attributes, and CORS.
6. Revisit CSRF if cookies ever need `SameSite=None`, if non-JSON mutation endpoints are added, or if the frontend/backend deployment model changes.
7. Introduce and test a Content-Security-Policy after inventorying any required inline styles/scripts and external origins.

## Merge gate

Do not merge PR #19 while a newly introduced compile, lint, type, test, or build failure exists. The current Nano ID audit failure is an existing/upstream dependency advisory and should remain visible until a compatible patched package is available.
