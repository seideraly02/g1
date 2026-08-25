# Password authentication API contract

Authentication uses a server-side session stored in a secure `HttpOnly`, `SameSite` cookie.
No password, password hash, session token, or auth profile is persisted by the frontend.
In production the same contract is implemented by `netlify/functions/api.mjs` against the
branch-specific Netlify Database PostgreSQL connection; no external backend URL is involved.

## Endpoints

`POST /auth/register`

Request:

```json
{
  "firstName": "Аян",
  "lastName": "Серікұлы",
  "city": "Алматы",
  "phone": "+77011234567",
  "password": "..."
}
```

`confirmPassword` is a UI-only validation field and must not be sent. On success the server sets
the session cookie and returns `{ id, firstName, lastName, city, phone, role, createdAt }`.
Duplicate phone numbers return `409 PHONE_ALREADY_REGISTERED`.
Registration attempts are capped before BCrypt work by phone fingerprint and trusted client
fingerprint; exceeding either window returns `429 RATE_LIMITED`.

`POST /auth/login`

Request: `{ "phone": "+77011234567", "password": "..." }`

Success sets the same session cookie and returns the user DTO. A missing user, wrong password, or
legacy account without a password always returns the same `401 INVALID_CREDENTIALS`. Failed login
attempts are rate-limited by phone fingerprint and trusted client fingerprint; rate limiting returns
`429 RATE_LIMITED`.

`GET /auth/session` returns the user DTO or `401`. `DELETE /auth/session` revokes the server
session and expires the cookie.

## Admin endpoints

Every `/admin/*` endpoint requires an authenticated user whose effective role is `admin`; otherwise
it returns `403 FORBIDDEN`. Role checks are performed server-side on every request.

- `GET /admin/overview` returns total, online/offline, seven-day registrations, and diagnostic
  activity counts. Online means an unexpired, non-revoked session active within five minutes;
  authenticated requests touch `last_seen_at` at most once per minute.
- `GET /admin/users?query=&page=1&limit=20` returns recent/searchable safe user DTOs. Page is capped
  at 1000 and limit at 50. Password and session hashes are never selected or returned.
- `POST /admin/questions` creates one active question. It accepts `subjectId`, `topic`, `text`, two
  to six unique `options`, `correctIndex`, and `explanation`; the server generates the ID. Editing
  and deletion are intentionally unavailable in this MVP.

Diagnostic submission includes a stable client `operationId`. The database enforces uniqueness per
user and returns the original stored response when the same operation is retried.
`POST /diagnostic/{subjectId}/check` accepts the stable diagnostic `operationId`, validates one
selected answer server-side, and returns that answer's selected index, correctness, and explanation.
The first selection is persisted per user, operation, and question; retries replay it and cannot
change it. This allows immediate feedback without exposing the full answer key in the question
response. The final `/submit` accepts only the five persisted selections and remains the idempotent
persistence operation.

## Password and legacy policy

- Passwords are accepted only over HTTPS in production and stored solely as adaptive BCrypt hashes.
- Passwords, hashes, session cookies, and credentials must never appear in logs or API responses.
- Existing legacy users keep a nullable `password_hash`.
- A legacy number cannot set a password through registration because that would allow account
  takeover. It receives `PHONE_ALREADY_REGISTERED`.
- Password reset and legacy account recovery are intentionally unavailable until a separate
  proof-of-ownership flow is implemented.
