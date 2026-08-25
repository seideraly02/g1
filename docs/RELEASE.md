# Qadam ENT release checklist

## 1. Netlify Database

- The Netlify site must use a credit-based plan; migrate from Legacy Free before enabling Database.
- Confirm Database is enabled for the site. Installing `@netlify/database` lets Netlify provision it
  automatically on deploy.
- Keep all schema changes in `netlify/database/migrations/`. Production and preview migrations are
  applied automatically before a deploy is published.
- Do not edit an already-applied migration. Add a new backwards-compatible migration instead.
- Never expose or commit `NETLIFY_DB_URL`; Netlify injects the branch-specific connection securely.
- This cutover is approved only as an empty-data launch: the previous production proxy had no
  `BACKEND_API_URL`, so it had no authoritative backend data. If an external production database is
  discovered, stop the release and run a separately reviewed import before switching traffic.
- The baseline keeps `password_hash` nullable so a future controlled legacy import can preserve
  unclaimable accounts without weakening registration or login.

Required Netlify environment:

```text
QADAM_SECURITY_PEPPER=<random-secret-at-least-32-bytes>
SESSION_TTL_DAYS=30
PASSWORD_BCRYPT_STRENGTH=12
```

The Function fails closed when the security pepper, BCrypt cost or session TTL is unsafe.
For first local end-to-end setup run `npx netlify-cli database init --yes`, then
`npx netlify-cli database migrations apply`, and finally `npx netlify-cli dev`. Local migrations are
explicit; production and preview deploy migrations are automatic.

## 2. Netlify

The frontend is built with `VITE_API_BASE_URL=/api`. `netlify/functions/api.mjs` is the production
backend and talks directly to the deploy's Netlify Database branch; no external proxy URL is used.
`VITE_REQUIRE_AUTHENTICATION=true` is mandatory for release builds.

For GitHub Actions based Netlify deployment also configure repository secrets:

```text
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

## 3. Release verification

- Frontend CI is green.
- Function tests and frontend CI are green.
- Native Netlify migrations complete successfully before Netlify publishes the production deploy;
  a migration failure must block publication.
- The deploy workflow verifies `GET /api/health` against the published deploy and requires database
  `ok`. Pull requests should additionally use Netlify's isolated deploy-preview database branch.
- Registration stores only a BCrypt password hash and creates an HttpOnly Secure session cookie.
- Login succeeds with the registered phone/password and uses a generic credentials error on failure.
- Duplicate and legacy phone registration returns `PHONE_ALREADY_REGISTERED`; password reset is not
  available in this release.
- `GET /auth/session` succeeds after registration or login and returns 401 without a valid session.
- Diagnostic returns exactly five questions.
- Admin endpoints reject non-admin sessions, cap user pagination, and never expose credential or
  session hashes. Online activity uses a five-minute window with at most one session touch write per
  minute.
- Admin question creation validates the subject, 2–6 unique options, correct index, and explanation;
  edit/delete actions are not part of this release.
- Every first diagnostic selection is locked per user/operation/question; final submission accepts
  only those five selections and stores both the attempt and five answer rows.
- Logout revokes the server session.
- Refreshing a deep Vue route does not return 404 on Netlify.

## 4. Rollback

- Roll back the Netlify site to the previous known-good deploy if the Function fails.
- Restore from a Netlify Database snapshot only when data recovery is required; a code rollback does
  not roll schema changes back automatically.
- Use expand-and-contract migrations so both the previous and new Functions tolerate the schema
  during deploy and rollback windows.
- Validate migrations on the isolated deploy-preview database branch before publishing production.

## 5. Known release boundary

The release foundation currently covers registration/session handling, subjects, diagnostic questions, diagnostic result persistence and the existing Vue screens. Training, full mock ҰБТ/ЕНТ sessions, question administration, ranking and advanced progress analytics need their own backend modules before they can be treated as server-backed production features.
