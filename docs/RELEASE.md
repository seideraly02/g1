# Qadam ENT release checklist

## 1. Backend infrastructure

- Provision PostgreSQL.
- Deploy the image built from `server/Dockerfile`.
- Configure HTTPS on the public backend URL.
- Confirm `GET /health` returns HTTP 200.
- Confirm `GET /actuator/health` returns `UP`.

Required backend environment:

```text
AUTH_MODE=production
DATABASE_URL=jdbc:postgresql://<host>:5432/<database>
DATABASE_USER=<user>
DATABASE_PASSWORD=<strong-password>
FRONTEND_ORIGINS=https://<netlify-site-or-custom-domain>
SECURITY_PEPPER=<random-secret-at-least-32-characters>
SESSION_COOKIE_SECURE=true
SESSION_COOKIE_SAME_SITE=Lax
SESSION_TTL_DAYS=30
TELEGRAM_GATEWAY_URL=<gateway-url>
TELEGRAM_GATEWAY_TOKEN=<secret-token>
SWAGGER_ENABLED=false
```

The application refuses to start in production when critical security settings are missing or unsafe.

## 2. Netlify

Configure the site environment variable:

```text
BACKEND_API_URL=https://<backend-host>
```

The frontend is built with `VITE_API_BASE_URL=/api`. `netlify/functions/api.mjs` proxies browser API calls to the backend and forwards HttpOnly session cookies.

For GitHub Actions based Netlify deployment also configure repository secrets:

```text
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

## 3. Release verification

- Frontend CI is green.
- Backend CI is green.
- Flyway migrations complete successfully on a clean PostgreSQL database.
- Docker image builds successfully.
- Registration request returns a Telegram OTP request id.
- OTP verification creates an HttpOnly Secure session cookie.
- `GET /auth/session` succeeds after verification and returns 401 without a valid session.
- Diagnostic returns exactly five questions.
- Diagnostic submission stores both the attempt and five answer rows.
- Logout revokes the server session.
- Refreshing a deep Vue route does not return 404 on Netlify.

## 4. Rollback

- Keep the previously deployed backend image tag available.
- Never run Flyway `clean` in production.
- Before destructive schema changes, take a PostgreSQL backup.
- Deploy database-compatible changes before removing old API fields used by the current frontend.

## 5. Known release boundary

The release foundation currently covers registration/session handling, subjects, diagnostic questions, diagnostic result persistence and the existing Vue screens. Training, full mock ҰБТ/ЕНТ sessions, question administration, ranking and advanced progress analytics need their own backend modules before they can be treated as server-backed production features.
