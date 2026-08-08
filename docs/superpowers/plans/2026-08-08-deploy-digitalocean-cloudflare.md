# План: деплой appside-down-be на DigitalOcean + Cloudflare

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Бекенд працює за публічним HTTPS-URL `https://api.<домен>` на DO droplet за Cloudflare; фронт перемкнуто на прод-URL.

**Architecture:** Усе в Docker Compose на droplet: `db` + `redis` (без публічних портів), `api` + `worker` (спільний образ, різні команди), `caddy` (єдиний вихід назовні, 80/443, Cloudflare Origin Cert, режим Full strict). Деплой ручний: `git pull` + `docker compose up -d --build`.

**Tech Stack:** NestJS 11, Prisma 7 (`@prisma/adapter-pg`, без бінарного рушія), BullMQ, Postgres 15, Redis 7, Caddy 2, Docker Compose, Cloudflare (DNS + proxy + Origin CA), Ubuntu 24.04.

## Global Constraints

- Жодних git-комітів без явного дозволу користувачки — кожен commit-крок виконується лише після її «так».
- Жодних дій на сервері/у Cloudflare/DO без явної згоди — перед кожною серверною задачею показати команди і дочекатись підтвердження.
- Жодних коментарів у коді та конфігах.
- Секрети не потрапляють у репо: прод-`.env` існує лише на сервері; у репо — тільки `.env.production.example` з плейсхолдерами.
- Дев-секрети НЕ переїжджають у прод: усі секрети генеруються заново.
- Локальний `docker-compose.yml` (дев) не змінюється.
- Env-змінні мають проходити Joi-валідацію з `src/app.module.ts` (`ConfigModule.forRoot`, рядки ~19–30) — перелік обов'язкових звіряти саме там.

---

## Фаза 1 — зміни в репо (локально)

### Task 1: TTL access-токена 30s → 15m

**Files:**
- Modify: `src/auth/auth.service.ts:33`

**Interfaces:**
- Produces: access-токени з `expiresIn: '15m'` — фронтовий silent-refresh перестане смикатись кожні 30 секунд.

- [ ] **Step 1: Внести правку**

Було:
```ts
this.jwtService.signAsync({ userId, email, typ: 'access' }, { secret: this.config.getOrThrow('AT_SECRET'), expiresIn: '30s' }),
```
Стає:
```ts
this.jwtService.signAsync({ userId, email, typ: 'access' }, { secret: this.config.getOrThrow('AT_SECRET'), expiresIn: '15m' }),
```

- [ ] **Step 2: Перевірити, що проєкт збирається і тести проходять**

Run: `cd /Users/user/appside-down-be && npm run build && npm test`
Expected: build без помилок; тести зелені (якщо якийсь тест зашитий на 30s — оновити його очікування на 15m).

- [ ] **Step 3: Commit (тільки після явного дозволу)**

```bash
git add src/auth/auth.service.ts
git commit -m "fix: set production access token TTL to 15m"
```

### Task 2: Dockerfile + .dockerignore

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`

**Interfaces:**
- Produces: образ, що вміє і `node dist/main` (API, дефолтна команда), і `node dist/worker.main` (worker, команда перевизначається в compose). Task 3 покладається на це та на теку `/app/uploads` усередині образу.

- [ ] **Step 1: Перевірити структуру dist локально**

Run: `cd /Users/user/appside-down-be && npm run build && ls dist`
Expected: у `dist/` є `main.js` і `worker.main.js` (саме на ці шляхи розраховані `start:prod`-скрипти). Якщо структура інша (наприклад `dist/src/main.js`) — скоригувати `CMD`/`command` нижче під фактичні шляхи.

- [ ] **Step 2: Створити `.dockerignore`**

```
node_modules
dist
.env
.env.*
uploads
.git
coverage
docs
test
*.log
.DS_Store
```

- [ ] **Step 3: Створити `Dockerfile`**

```dockerfile
FROM node:24-slim AS build
WORKDIR /app
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
COPY package.json package-lock.json ./
RUN npm ci
COPY prisma ./prisma
COPY prisma.config.ts tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npx prisma generate
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./
COPY --from=build /app/dist ./dist
RUN mkdir -p uploads/avatars
EXPOSE 5111
CMD ["node", "dist/main"]
```

Пояснення рішень (для рев'ю, не для коментарів у файлі):
- `DATABASE_URL`-плейсхолдер у build-стадії — `prisma.config.ts` читає цю змінну при `prisma generate`; жива БД для генерації не потрібна.
- У фінальний образ копіюється **повний** `node_modules` (з devDeps): так у контейнері доступний `npx prisma migrate deploy`. Образ більший, ніж міг би бути — свідомий трейд-оф заради простоти; оптимізація (окрема migrate-стадія) — потім.
- `prisma/` + `prisma.config.ts` у рантаймі — саме для `migrate deploy`.

- [ ] **Step 4: Зібрати образ локально**

Run: `cd /Users/user/appside-down-be && docker build -t appside-be:test .`
Expected: збірка успішна.

- [ ] **Step 5: Смоук-тест образу проти локальних db/redis**

Run (локальні Postgres/Redis з дев-compose мають працювати):
```bash
docker run --rm -d --name appside-smoke \
  --env-file .env \
  -e DATABASE_URL="postgresql://user:password@host.docker.internal:5435/appside_down_db" \
  -e REDIS_HOST=host.docker.internal \
  -p 5112:5111 appside-be:test
sleep 5 && curl -s http://localhost:5112/ && docker logs appside-smoke --tail 20
docker stop appside-smoke
```
Expected: `curl` повертає відповідь `GET /` (Hello World), у логах немає помилок підключення до БД/Redis.

- [ ] **Step 6: Commit (тільки після явного дозволу)**

```bash
git add Dockerfile .dockerignore
git commit -m "feat: add production Dockerfile"
```

### Task 3: docker-compose.prod.yml + Caddyfile + .env.production.example

**Files:**
- Create: `docker-compose.prod.yml`
- Create: `Caddyfile`
- Create: `.env.production.example`

**Interfaces:**
- Consumes: образ із Task 2 (`build: .`, команди `node dist/main` / `node dist/worker.main`).
- Produces: повний прод-стек; Task 7–13 виконують `docker compose -f docker-compose.prod.yml ...` на сервері. Очікує на сервері поруч із файлами: `.env` (за зразком example) і теку `certs/` з `origin.pem` + `origin.key`.

- [ ] **Step 1: Створити `docker-compose.prod.yml`**

```yaml
services:
  db:
    image: postgres:15
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  redis:
    image: redis:7
    restart: always
    command: ["redis-server", "--appendonly", "yes"]
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 10

  api:
    build: .
    restart: always
    env_file: .env
    environment:
      REDIS_HOST: redis
      REDIS_PORT: "6379"
    volumes:
      - uploads:/app/uploads
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  worker:
    build: .
    restart: always
    command: ["node", "dist/worker.main"]
    env_file: .env
    environment:
      REDIS_HOST: redis
      REDIS_PORT: "6379"
      DB_STATEMENT_TIMEOUT_MS: "10000"
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  caddy:
    image: caddy:2
    restart: always
    ports:
      - "80:80"
      - "443:443"
    environment:
      DOMAIN: ${DOMAIN}
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - ./certs:/etc/caddy/certs:ro
      - caddy_data:/data
      - caddy_config:/config
    depends_on:
      - api

volumes:
  pgdata:
  redisdata:
  uploads:
  caddy_data:
  caddy_config:
```

Ключові рішення:
- `db`/`redis` без `ports:` — назовні не видно (Docker публікує порти в обхід UFW, тому єдиний надійний спосіб «закрити» їх — не публікувати взагалі).
- `REDIS_HOST=redis` задано в `environment` поверх `env_file` — щоб значення з `.env` точно не переважило.
- `DB_STATEMENT_TIMEOUT_MS: "10000"` у worker повторює `start:worker:prod` із package.json.
- `uploads` — named volume: аватарки переживають перестворення контейнера.

- [ ] **Step 2: Створити `Caddyfile`**

```
{$DOMAIN} {
	tls /etc/caddy/certs/origin.pem /etc/caddy/certs/origin.key
	reverse_proxy api:5111
}
```

(`{$DOMAIN}` Caddy підставляє з env контейнера; явний `tls` вимикає спроби отримати Let's Encrypt.)

- [ ] **Step 3: Створити `.env.production.example`**

Перед створенням звірити перелік обов'язкових змінних із Joi-схемою в `src/app.module.ts` (рядки ~19–30) — якщо там є щось поза цим списком, додати.

```
DOMAIN=api.example.xyz
POSTGRES_USER=appside
POSTGRES_PASSWORD=change-me
POSTGRES_DB=appside_down_db
DATABASE_URL=postgresql://appside:change-me@db:5432/appside_down_db
AT_SECRET=change-me
RT_SECRET=change-me
JWT_SECRET=change-me
RESEND_API_KEY_DEV=change-me
DB_STATEMENT_TIMEOUT_MS=5000
REDIS_HOST=redis
REDIS_PORT=6379
PORT=5111
```

- [ ] **Step 4: Валідація compose-файлу**

Run: `cd /Users/user/appside-down-be && cp .env.production.example /tmp/env-check && docker compose -f docker-compose.prod.yml --env-file /tmp/env-check config >/dev/null && echo OK`
Expected: `OK` без warnings про відсутні змінні.

- [ ] **Step 5: Commit (тільки після явного дозволу)**

```bash
git add docker-compose.prod.yml Caddyfile .env.production.example
git commit -m "feat: add production compose stack with caddy tls termination"
```

- [ ] **Step 6: Push у GitHub (тільки після явного дозволу)** — без цього серверу нізвідки клонувати код.

---

## Фаза 2 — ручні дії користувачки (акаунти й домен)

### Task 4: Домен + акаунти

**Files:** —

**Interfaces:**
- Produces: активний домен у Cloudflare (далі в плані — `<домен>`, API-хост `api.<домен>`), акаунт DO з платіжкою.

- [ ] **Step 1:** Акаунт DigitalOcean із платіжним методом (якщо нема).
- [ ] **Step 2:** У Cloudflare: Registrar → Register domain → обрати дешевий TLD (`.xyz` тощо, $2–3/рік) → купити. Домен куплений у Cloudflare одразу активний у DNS — нічого переносити не треба.
- [ ] **Step 3:** Повідомити асистентці ім'я домену — воно підставляється в `DOMAIN` і DNS-кроки нижче.

---

## Фаза 3 — сервер (кожна задача: показати команди → «так» → виконати)

### Task 5: Створити droplet

**Files:** —

**Interfaces:**
- Consumes: SSH-ключ користувачки (`~/.ssh/id_*.pub`; якщо нема — згенерувати `ssh-keygen -t ed25519`).
- Produces: IP droplet (далі — `<IP>`), SSH-доступ `ssh root@<IP>`.

- [ ] **Step 1:** DO: Create → Droplets → Region **Frankfurt** → Ubuntu **24.04 LTS** → Basic → Regular **2GB/1vCPU ($12/міс)** → Authentication: **SSH key** (додати публічний ключ) → Create.
- [ ] **Step 2: Перевірити доступ**

Run: `ssh root@<IP> 'echo connected && uname -a'`
Expected: `connected` + версія Ubuntu.

### Task 6: Базове налаштування сервера (Docker + UFW)

**Files:** — (все на сервері)

**Interfaces:**
- Produces: docker + compose plugin, файрвол 22/80/443, тека `/opt/appside`.

- [ ] **Step 1: Оновлення системи і Docker**

```bash
apt update && apt upgrade -y
curl -fsSL https://get.docker.com | sh
docker --version && docker compose version
```
Expected: версії Docker ≥ 27 і compose v2 друкуються без помилок.

- [ ] **Step 2: Файрвол**

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status
```
Expected: `Status: active`, у списку лише OpenSSH/80/443. (`allow OpenSSH` — обов'язково ПЕРЕД `enable`, інакше сесія заблокує сама себе.)

- [ ] **Step 3:** `mkdir -p /opt/appside`

### Task 7: Доставити код на сервер

**Files:** — (на сервері)

**Interfaces:**
- Produces: `/opt/appside/appside-down-be` — клон репо з файлами Фази 1.

- [ ] **Step 1: Deploy key (якщо репо приватне)**

На сервері:
```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```
GitHub → репо → Settings → Deploy keys → Add (read-only, без write) → вставити ключ.

- [ ] **Step 2: Клонування**

```bash
cd /opt/appside && git clone git@github.com:<owner>/appside-down-be.git
ls appside-down-be/Dockerfile appside-down-be/docker-compose.prod.yml
```
Expected: обидва файли на місці.

### Task 8: Прод-.env з новими секретами

**Files:**
- Create (на сервері): `/opt/appside/appside-down-be/.env`

**Interfaces:**
- Consumes: `<домен>` із Task 4; шаблон `.env.production.example`.
- Produces: `.env`, який проходить Joi-валідацію при старті api.

- [ ] **Step 1: Згенерувати секрети** (на сервері, кожен рядок — окреме значення)

```bash
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -base64 48   # AT_SECRET
openssl rand -base64 48   # RT_SECRET
openssl rand -base64 48   # JWT_SECRET
```

- [ ] **Step 2: Створити `.env`** за шаблоном `.env.production.example`: `DOMAIN=api.<домен>`, згенеровані значення, `DATABASE_URL=postgresql://appside:<POSTGRES_PASSWORD>@db:5432/appside_down_db`, реальний `RESEND_API_KEY_DEV` (єдине дев-значення, що переноситься — Resend-ключ той самий). `chmod 600 .env`.

Expected: `grep -c change-me .env` → `0`.

### Task 9: Cloudflare Origin Certificate

**Files:**
- Create (на сервері): `/opt/appside/appside-down-be/certs/origin.pem`, `certs/origin.key`

**Interfaces:**
- Produces: сертифікат, який `caddy` монтує як `/etc/caddy/certs/*` (шляхи з Caddyfile, Task 3).

- [ ] **Step 1:** Cloudflare dashboard → домен → SSL/TLS → **Origin Server** → Create Certificate → RSA, hostnames: `api.<домен>` (можна і `*.<домен>`), 15 years → Create. Скопіювати Certificate і Private Key.
- [ ] **Step 2:** На сервері: `mkdir -p certs`, вставити сертифікат у `certs/origin.pem`, ключ у `certs/origin.key`, `chmod 600 certs/origin.key`.
- [ ] **Step 3:** Cloudflare → SSL/TLS → Overview → режим **Full (strict)**.

### Task 10: Перший запуск стека

**Files:** — (на сервері, тека репо)

**Interfaces:**
- Consumes: `.env` (Task 8), `certs/` (Task 9).
- Produces: п'ять запущених контейнерів.

- [ ] **Step 1:** `docker compose -f docker-compose.prod.yml up -d --build`
(Якщо збірка впаде по OOM — додати swap: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, повторити збірку.)

- [ ] **Step 2: Перевірити стан**

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs api --tail 30
docker compose -f docker-compose.prod.yml logs worker --tail 30
```
Expected: `db`/`redis` — healthy; api слухає 5111 (Nest банер у логах, без Joi-помилок); worker без крешів. `api` на цьому етапі може скаржитись на відсутні таблиці — це нормально до Task 11.

### Task 11: Міграції

**Files:** — (на сервері)

**Interfaces:**
- Consumes: контейнерний образ (у ньому є prisma CLI і `prisma/migrations/` — 10 міграцій від `20260321153546_init_user` до `20260807193646_add_module_author_username`).
- Produces: схема БД у проді.

- [ ] **Step 1:** `docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy`
Expected: список із 10 застосованих міграцій, `All migrations have been successfully applied`.

- [ ] **Step 2:** Рестарт api після появи схеми: `docker compose -f docker-compose.prod.yml restart api worker`, у логах — чистий старт.

### Task 12: DNS + наскрізний смоук-тест

**Files:** — (Cloudflare + локальний термінал)

**Interfaces:**
- Produces: робочий `https://api.<домен>` — контракт для Task 13.

- [ ] **Step 1:** Cloudflare → DNS → Add record: type **A**, name `api`, IPv4 `<IP>`, Proxy status **Proxied** (помаранчева хмарка).
- [ ] **Step 2: Смоук ззовні (з ноутбука)**

```bash
curl -s https://api.<домен>/
curl -s -X POST https://api.<домен>/auth/signup -H 'content-type: application/json' -d '{"email":"smoke@test.dev","password":"Smoke-test-1"}'
```
Expected: перший — Hello World; другий — успішна відповідь або доменна помилка валідації (тобто запит дійшов до Nest через Cloudflare і Caddy). Тіло/шляхи звірити з реальними DTO в `src/auth` перед запуском.
- [ ] **Step 3:** Перевірити refresh-флоу і один авторизований запит (наприклад список папок) — токени працюють наскрізь.
- [ ] **Step 4:** Перевірити, що напряму БД недоступна: `nc -zv -w3 <IP> 5432` і `nc -zv -w3 <IP> 6379` з ноутбука → обидва **відмовляють** (timeout/refused).

---

## Фаза 4 — фронт

### Task 13: Перемкнути фронт на прод

**Files:**
- Modify: `/Users/user/Desktop/Projects/appside-down/src/api/config.ts` (`API_BASE_URL`)

**Interfaces:**
- Consumes: `https://api.<домен>` (Task 12).

- [ ] **Step 1:** Оновити `API_BASE_URL` на `https://api.<домен>` (подивитись фактичну структуру файлу: якщо там уже є розгалуження dev/prod — вписати прод-гілку, а не затерти дев-URL).
- [ ] **Step 2:** Запустити застосунок на телефоні: реєстрація/логін, silent refresh (почекати >15 хв або форсувати), картки/навчання, завантаження аватарки (перевіряє volume `uploads`).
- [ ] **Step 3: Commit фронта (тільки після явного дозволу)**

```bash
git add src/api/config.ts
git commit -m "feat: point api base url at production domain"
```

---

## Прогрес виконання

- 2026-08-09: Фаза 1 виконана (Task 1–3), усі верифікації пройдені: образ збирається,
  api відповідає `GET / → 200` проти локальних db/redis, worker стартує
  (`study worker started`), `npm test` зелений, `docker compose -f
  docker-compose.prod.yml config` валідний. Коміти — очікують дозволу.
- Відхилення від плану, знайдені під час виконання:
  - Збірка клала entry в `dist/src/main.js` замість `dist/main.js` (ламало і
    `start:prod`, і Docker `CMD`). Корінь: у компіляцію потрапляли TS-файли поза
    `src/` — `prisma.config.ts` та застарілий згенерований клієнт
    `prisma/generated/` (12 закомічених файлів, ніщо їх не імпортувало; реальний
    клієнт — `src/generated/prisma`). Фікс: `prisma.config.ts` додано в exclude
    `tsconfig.build.json`, `prisma/generated/` видалено.
  - `JWT_SECRET` не використовується ніде в `src/` — у `.env.production.example`
    не включений (у дев-`.env` лишається як легасі, можна прибрати окремо).

## Після деплою (поза скоупом, нагадування)

- Resend: верифікувати власний домен, замінити `onboarding@resend.dev`.
- Бекапи Postgres (`pg_dump` за кроном + копія поза droplet).
- UFW/Cloudflare: обмежити 80/443 до IP-діапазонів Cloudflare.
- Оптимізація образу (окрема migrate-стадія, `npm ci --omit=dev`).
