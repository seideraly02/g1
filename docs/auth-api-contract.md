# Phone registration API contract

The browser calls the Qadam backend only. Telegram Gateway credentials and its API calls must remain on the server. Authentication uses a secure `HttpOnly`, `SameSite` cookie; no token is returned to or persisted by the frontend.

## Endpoints

`POST /auth/telegram/request-code`

Request: `{ "fullName": "...", "city": "...", "phone": "+77XXXXXXXXX" }`

Success: `{ "requestId": "...", "expiresAt": "ISO-8601", "resendAfterSeconds": 60 }`

The server validates and rate-limits the request, then sends the code with the official Telegram Gateway API. `requestId` must be opaque and single-purpose.

`POST /auth/telegram/verify-code`

Request: `{ "requestId": "...", "code": "123456" }`

Success sets the session cookie and returns `{ "id", "fullName", "city", "phone", "verifiedAt" }`. Verification is single-use and limited by attempts and expiry.

`GET /auth/session` returns the same user or `401`. `DELETE /auth/session` revokes the server session.

Error bodies use `{ "code": "INVALID_CODE | CODE_EXPIRED | TELEGRAM_NOT_LINKED" }`; rate limiting returns `429`. Logs must not contain the code, phone in clear text, session cookie, or Telegram credentials.
