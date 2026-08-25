# Qadam ENT

Мобильное приложение для подготовки к ҰБТ/ЕНТ.

## Стек

Frontend:
- Vue 3 + TypeScript + Vite
- Pinia + Vue Router
- Tailwind CSS
- Netlify

Backend:
- Netlify Functions (Node.js 22)
- Netlify Database (managed PostgreSQL)
- `@netlify/database` + `pg`
- BCrypt password hashes and HMAC-hashed cookie sessions

`server/` keeps the Spring Boot implementation as a local/reference runtime; production `/api`
is served by Netlify Functions.

## Локальный запуск

Production-parity development (Functions + local Netlify Database + frontend):

```bash
npm ci
npx netlify-cli database init --yes
npx netlify-cli database migrations apply
npx netlify-cli dev
```

Netlify CLI поднимает локальную PostgreSQL и обслуживает `/api`; миграции из
`netlify/database/migrations/` нужно применить отдельной командой перед первым запуском. Регистрация сразу создаёт аккаунт и защищённую
HttpOnly cookie-сессию; для входа используются телефон Казахстана и пароль.

Перед запуском скопируйте `.env.example` в `.env` и замените только локальный
`QADAM_SECURITY_PEPPER` на случайный секрет длиной не менее 32 байт.

Frontend:

```bash
cp .env.example .env
npm ci
npm run dev
```

## Проверки перед merge

Frontend:

```bash
npm run audit
npm run format:check
npm run lint
npm run type-check
npm test
npm run build
```

Spring reference backend:

```bash
gradle -p server clean test bootJar
```

GitHub Actions запускает оба quality gate автоматически для pull request.

## Production

Frontend, API и PostgreSQL работают в одном Netlify site. Frontend обращается к same-origin `/api`,
а `netlify/functions/api.mjs` выполняет auth, session, subjects и diagnostic операции напрямую в
Netlify Database. Внешний Spring host и `BACKEND_API_URL` не требуются.

В Netlify необходимо перейти на credit-based plan, создать/подтвердить Database и задать secret:

```text
QADAM_SECURITY_PEPPER=<random-secret-at-least-32-bytes>
PASSWORD_BCRYPT_STRENGTH=12
SESSION_TTL_DAYS=30
```

`@netlify/database` автоматически provision-ит database для deploy, а Netlify применяет SQL из
`netlify/database/migrations/` перед публикацией production deploy. `NETLIFY_DB_URL` выдаётся
платформой автоматически и не должен храниться в git или задаваться как публичная build variable.

Текущий production cutover является empty-data launch: прежний Netlify proxy не имел
`BACKEND_API_URL`, поэтому production API и авторитетной backend-БД не было. Если перед deploy
обнаружится отдельная БД с реальными пользователями, deploy нужно остановить и выполнить отдельный
проверяемый импорт. Baseline допускает `password_hash = null` для такого legacy-импорта; эти номера
нельзя перерегистрировать или использовать для входа без будущего recovery flow.

Для ручного deploy из GitHub Actions дополнительно нужны repository secrets:

```text
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

Подробный release checklist: `docs/RELEASE.md`.
