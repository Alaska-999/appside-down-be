# appside-down-be

Backend API for a flashcard-based learning app, built with [NestJS](https://nestjs.com/) and PostgreSQL (via Prisma).

## Overview

The service organizes learning content into **Folders → Modules → Flashcards**, tracks study progress through spaced-repetition style **Study Events**, and supports authentication, push notifications and user management.

### Core domains (`src/`)

- `auth` — signup/login, JWT access & refresh tokens, password reset
- `users` — user profile and account management
- `folders` — folders that group modules
- `modules` — flashcard modules/decks (supports tags, provenance tracking, public visibility)
- `flashcards` — individual flashcards belonging to a module
- `study` — study session events and progress tracking
- `notifications` — push notification tokens/delivery
- `prisma` — Prisma client wrapper/module
- `common` — shared interceptors, logger, utilities

### Background worker

Study events (flashcard progress) are processed by a BullMQ worker. It used to run inside the same process as the HTTP API, sharing its DB connection pool — under load, the worker could starve normal HTTP requests of connections. It now boots from its own entry point (`src/worker.main.ts` / `src/worker.module.ts`), with no HTTP server and no controllers, and must be run as a separate process/deploy.

The worker uses a longer Postgres `statement_timeout` (`DB_STATEMENT_TIMEOUT_MS=10000`, set in the `start:worker:*` scripts) than the HTTP process (2s default), since its batched study-event transaction can legitimately take longer than a single API request.

Failed jobs are auto-pruned (`removeOnFail: { age: 24h, count: 1000 }`) so Redis doesn't grow unbounded.

## Tech stack

- [NestJS](https://nestjs.com/) 11 (Express platform)
- PostgreSQL + [Prisma ORM](https://www.prisma.io/) (with `@prisma/adapter-pg`)
- Redis + [BullMQ](https://docs.bullmq.io/) for background jobs
- JWT auth (`@nestjs/jwt`, `passport-jwt`) with access/refresh token rotation
- [Resend](https://resend.com/) for transactional email
- Winston for structured logging
- Joi for environment variable validation
- Jest + Supertest for unit/e2e tests

## Getting started

### Prerequisites

- Node.js (LTS)
- Docker (for local Postgres/Redis via `docker-compose.yml`)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.production.example` to `.env` and fill in real values. Required variables (validated on boot via Joi):

| Variable              | Description                                         |
| --------------------- | ---------------------------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string                         |
| `AT_SECRET`           | Access token JWT secret (min 32 chars)               |
| `RT_SECRET`           | Refresh token JWT secret (min 32 chars, must differ from `AT_SECRET`) |
| `RESEND_API_KEY_DEV`  | Resend API key for sending emails                    |
| `REDIS_HOST`          | Redis host (defaults to `localhost`)                 |
| `REDIS_PORT`          | Redis port (defaults to `6379`)                      |
| `DB_STATEMENT_TIMEOUT_MS` | Postgres statement timeout (HTTP: 2s default, worker: 10s) |
| `PORT`                | HTTP port (defaults to `5111`)                       |

### 3. Start local infrastructure

```bash
docker-compose up -d
```

This starts Postgres (port `5435`) and Redis (port `6379`).

### 4. Run database migrations

```bash
npx prisma migrate deploy
```

### 5. Run the app

```bash
# development (watch mode)
npm run start:dev

# production build
npm run build
npm run start:prod
```

### Run the background worker (separate process)

```bash
# development (watch mode)
npm run start:worker:dev

# production
npm run start:worker:prod
```

## Testing

```bash
# unit tests
npm run test

# e2e tests
npm run test:e2e

# test coverage
npm run test:cov
```

## Linting & formatting

```bash
npm run lint
npm run format
```

## Deployment

The app ships with a `Dockerfile`, `docker-compose.prod.yml` and a `Caddyfile` for a reverse proxy setup. See `.env.production.example` for the production environment variable template.

## License

UNLICENSED — private project.
