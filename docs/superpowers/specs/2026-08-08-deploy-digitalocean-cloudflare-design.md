# Деплой appside-down-be на DigitalOcean droplet за Cloudflare

Дата: 2026-08-08. Статус: дизайн затверджено, план виконання — окремим документом.

## Мета

Публічний HTTPS-URL бекенду для Expo-застосунку. Фронт на сервер не деплоїться —
йому потрібен лише `API_BASE_URL` на прод-домен.

## Рішення (затверджені)

- **Хостинг:** DigitalOcean droplet, Ubuntu 24.04 LTS, 2GB RAM / 1 vCPU (~$12/міс), регіон Frankfurt.
- **Запуск:** усе в Docker Compose (варіант «A»). На хості — лише Docker і UFW.
- **TLS:** Cloudflare proxy у режимі **Full (strict)** + Cloudflare Origin Certificate (15 років) у Caddy.
- **Домен:** дешевий TLD (типу `.xyz`) через Cloudflare Registrar; API на сабдомені `api.<домен>`.
- **Деплой-механізм:** ручний — `git pull` + `docker compose up -d --build` на сервері. Без CI/CD на цьому етапі.

## Архітектура на сервері

```
інтернет → Cloudflare (HTTPS, ховає IP droplet)
              ↓ HTTPS (Origin Cert, Full strict)
          caddy (80/443 — єдині відкриті порти)
              ↓ http усередині docker-мережі
          api (NestJS, node dist/main, порт 5111)
          worker (BullMQ, node dist/worker.main) — той самий образ, інша команда
              ↓            ↓
          db (Postgres 15)   redis (7, appendonly)
```

- `db` і `redis` у прод-compose **без** `ports:` — доступні лише контейнерам у
  внутрішній мережі за іменами `db` / `redis`.
- UFW: дозволені лише 22, 80, 443.
- Volumes: `pgdata`, `redisdata`, `uploads` (аватарки, роздаються через
  `useStaticAssets`), `caddy_data` + том/файли Origin-сертифіката.
- `trust proxy, 1` у `main.ts` вже стоїть — `@Ip()` бачитиме реальний IP клієнта
  за Cloudflare/Caddy.

## Зміни в репо бекенду

1. `Dockerfile` — multi-stage: стадія збірки (`npm ci` → `prisma generate` →
   `nest build`), фінальна стадія `node:24-slim` лише з рантайм-необхідним.
   Prisma 7 працює через `@prisma/adapter-pg` (JS-драйвер, без бінарного рушія),
   клієнт генерується в `src/generated/prisma`.
2. `.dockerignore` — виключити `node_modules`, `dist`, `.env`, `uploads`.
3. `docker-compose.prod.yml` — п'ять сервісів за схемою вище. Локальний
   `docker-compose.yml` не змінюється. Пароль Postgres — з env, не хардкод.
4. `Caddyfile` — 443 з Origin-сертифікатом, reverse_proxy на `api:5111`.
5. `src/auth/auth.service.ts:33` — TTL access-токена `'30s'` → `'15m'`
   (дев-значення, незакрита знахідка ревью).

## Конфігурація на сервері

`.env` у теці деплою (наприклад `/opt/appside/.env`), у репо не потрапляє:

- `DATABASE_URL` → хост `db:5432`, **новий** пароль (дев-значення не переїжджають)
- `REDIS_HOST=redis`, `REDIS_PORT=6379`
- Нові `AT_SECRET`, `RT_SECRET`, `JWT_SECRET` (згенеровані для прода)
- `RESEND_API_KEY_DEV` (назва змінної лишається — її вимагає Joi-валідація),
  `DB_STATEMENT_TIMEOUT_MS`, `PORT`

Міграції — явною командою, не автоматично при старті контейнера:
`docker compose run --rm api npx prisma migrate deploy`.

## Порядок деплою

1. Вручну (користувачка): акаунт DO + купівля домену в Cloudflare Registrar.
2. Створити droplet зі SSH-ключем.
3. На сервері: Docker + compose plugin, UFW (22/80/443).
4. `git clone` репо (приватне → deploy key).
5. Створити `.env` з новими секретами.
6. `docker compose -f docker-compose.prod.yml up -d --build`.
7. `prisma migrate deploy` (окремою командою, з переглядом що застосовується).
8. Cloudflare: проксований A-запис `api.<домен>` → IP droplet, SSL Full (strict),
   Origin Certificate → на сервер для Caddy.
9. Смоук-тест через `curl https://api.<домен>`: реєстрація/логін, refresh,
   пара доменних запитів.
10. Фронт: `src/api/config.ts` → `API_BASE_URL` на прод-домен.

Наступні релізи: `ssh` → `git pull` → `docker compose up -d --build` →
за потреби `migrate deploy`. Бек і фронт релізяться разом (контракт
`{ refreshToken }`); поки прод-юзерів нема, це зводиться до оновлення
`API_BASE_URL` одразу після деплою бекенду.

## Свідомо відкладено

- Верифікація власного домену в Resend (зараз лист іде з `onboarding@resend.dev`).
- Бекапи Postgres (`pg_dump` за кроном) — рекомендований наступний крок.
- CI/CD (автодеплой з GitHub).
- Обмеження 80/443 до IP-діапазонів Cloudflare в UFW.

## Обмеження виконання

Жодних git-комітів і жодних дій на сервері без явної згоди користувачки:
спочатку план кроку, потім виконання.
