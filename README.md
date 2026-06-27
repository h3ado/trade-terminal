# Trade Terminal

Freestanding trading workstation built with Vite, React, Express, and Prisma/Postgres.

## Stack

- Frontend: React, Vite, Tailwind, TanStack Query
- Backend: Express API in `server/`
- Database: Postgres via Prisma migrations
- Package manager: npm

## Architecture

Trade Terminal is a freestanding app. The browser talks to the Express API through `src/lib/api.ts`; in local development Vite proxies `/api` to `http://localhost:3001`. Prisma migrations in `server/prisma/migrations/` are the database source of truth.

The main terminal views are registered in `src/config/views.tsx`. FX tabs live in `src/config/fx.ts`; options modules and aliases live in `src/config/options.ts`. Navigation state is URL-backed, so deep links such as `/?view=options&tab=gex&ticker=SPY&sub=profile` hydrate the terminal directly.

Launchpad workspaces are stored in localStorage under `trade-terminal:launchpad:v2`. Older `lovable:launchpad:*` layouts are read once and migrated automatically.

## Setup

```sh
npm install
npm install --prefix server
cp .env.example .env
cp server/.env.example server/.env
npm run db:start
npm run db:migrate --prefix server
npm run dev
```

Frontend runs on `http://localhost:8080`. Vite proxies `/api` to `http://localhost:3001`.

## Environment

Root `.env`:

- `VITE_API_URL`: optional. Leave blank for same-origin `/api`; set for separate deployments.

Server `server/.env`:

- `DATABASE_URL`: required.
- `JWT_SECRET`: required outside throwaway local dev.
- `FRONTEND_URL`: required in production CORS config.
- Provider keys are optional; routes return empty fallback payloads or 5xx provider errors when a required provider is missing.

Common optional provider keys are documented in `server/.env.example`. Missing market-data keys do not require Supabase or edge functions; the Express routes either use deterministic fallbacks, return empty arrays, or report a provider error from the API layer.

## Scripts

```sh
npm run dev              # frontend + Express
npm run dev:frontend     # Vite only
npm run dev:server       # Express only
npm run lint
npm run typecheck
npm run test
npm run build
npm run server:build
npm run test:e2e
```

Database:

```sh
npm run db:start
npm run db:stop
npm run db:reset
npm run db:migrate --prefix server
```

## Workflows

- Start at `/auth`, create or log into a local account, then use the terminal shell.
- Use `view`, `macro`, `fx`, `tab`, `ticker`, and `sub` query params for reproducible terminal states.
- Use Launchpad (`LAUN` or `LP`) for multi-panel workspaces. Workspaces can be duplicated, renamed, reset, resized, and persisted locally.
- Use provider-backed routes through `/api/market/*`. Frontend code should import from `src/lib/api.ts` instead of calling `fetch('/api/...')` directly.

## Deployment

1. Install root and server dependencies with `npm ci`.
2. Set `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`.
3. Run `npm run db:migrate --prefix server`.
4. Build server with `npm run server:build`.
5. Build frontend with `npm run build`.
6. Serve `dist/` and `server/dist/index.js` behind the same origin, or set `VITE_API_URL`.

## Notes

Supabase and Lovable runtime paths are not part of the 1.0 app. Prisma migrations are the database source of truth.
