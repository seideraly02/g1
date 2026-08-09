# Qadam ENT

Мобильное приложение для подготовки к ҰБТ/ЕНТ.

## Стек

Frontend:
- Vue 3 + TypeScript + Vite
- Pinia + Vue Router
- Tailwind CSS
- Netlify

Backend:
- Java 21
- Spring Boot 3.5
- Spring Security
- Spring JDBC
- PostgreSQL + Flyway
- Testcontainers
- Docker

## Локальный запуск

Поднять PostgreSQL и Spring Boot API:

```bash
docker compose up --build
```

API будет доступен на `http://localhost:3000`, health-check — `http://localhost:3000/health`.

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

Backend:

```bash
gradle -p server clean test bootJar
```

GitHub Actions запускает оба quality gate автоматически для pull request.

## Production

Frontend публикуется в Netlify. В production он обращается к `/api`, а Netlify Function проксирует запросы в Spring Boot API. Это сохраняет HttpOnly cookie как same-origin для браузера.

В Netlify необходимо задать:

```text
BACKEND_API_URL=https://<backend-host>
```

Для ручного deploy из GitHub Actions дополнительно нужны repository secrets:

```text
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
```

Backend запускается из `server/Dockerfile`. Production-переменные перечислены в `server/.env.example`; обязательные требования дополнительно проверяются при старте приложения.

Подробный release checklist: `docs/RELEASE.md`.
