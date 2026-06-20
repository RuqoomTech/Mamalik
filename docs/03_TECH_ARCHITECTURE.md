# 03 — Technical Architecture

## Locked stack

| Layer | Decision |
|---|---|
| Frontend | Next.js + TypeScript + Tailwind |
| Map frontend | MapLibre GL JS |
| Backend | Next.js API routes / route handlers first |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma |
| Spatial operations | Raw SQL / TypedSQL for PostGIS-heavy operations |
| Tick processing | Separate worker process every 10 minutes |
| Realtime | Polling/refresh first; WebSockets later |
| Auth | Email/password + Google login |
| Admin | Simple admin panel in v0.1 |

## Repository structure

```text
mamalik/
  apps/
    web/
  packages/
    db/
    game/
    config/
  workers/
    tick-worker/
  docs/
  tasks/
```

Status: `apps/web`, `packages/db`, `packages/game`, and `workers/tick-worker` now contain implementation code. `workers/tick-worker` starts as a manual one-tick command foundation in Sprint 2 before scheduler behavior is added.

## Package manager

- Current package manager: npm.
- Root scripts delegate to `apps/web`.
- Web dependencies are app-local under `apps/web`.
- Shared package manifests can be added when `packages/db`, `packages/game`, `packages/config`, or `workers/tick-worker` receive implementation code.
- Root scripts now include `tick:once`, `tick:dev`, `tick:test`, and `tick:typecheck`.
- Root scripts now include `game:test` and `game:typecheck` for shared game-domain logic.
- `tick:once` is the first supported tick command and should be stabilized before relying on a long-running scheduler.

## Environment files

- `apps/web/.env.example` is the committed web app environment template.
- `apps/web/.env.local` is the local developer secret file and must remain ignored.
- Public browser-safe variables use `NEXT_PUBLIC_`.
- Server-only values such as `DATABASE_URL`, OAuth secrets, session secrets, admin allowlists, and worker secrets must stay server-side.

## App responsibilities

### `apps/web`

- Next.js App Router application
- Public landing pages later
- Auth pages
- Email/password register, login, and logout API route handlers
- Map selection
- Dashboard
- Kingdom management pages
- Admin panel
- API route handlers

### `packages/db`

- Prisma schema
- DB client
- migrations
- seed scripts
- raw SQL helpers for PostGIS

Status: Prisma config, PostgreSQL datasource, package-local dependencies, generated client output path, the PostGIS enablement migration, and the initial v0.1 model migration are configured.

### `packages/game`

- Economy formulas
- Tick logic
- Land price formulas
- Combat formulas
- Unit definitions
- Building definitions
- Research definitions

Status: Sprint 2 added the first package manifest, TypeScript config, exports, deterministic resource-generation formulas with named population-effect breakdowns, deterministic Food consumption formulas, and construction progress helpers.

### `workers/tick-worker`

- Lives outside the web app as a separate worker package/process.
- Computes stable 10-minute tick keys.
- Writes persistent `TickLog` rows with duplicate tick protection.
- `tick:once` currently generates Money, Food, Manpower, and Knowledge for each processed kingdom, reports named population tax and population Manpower contributions, subtracts Food consumption for population and army, clamps Food at zero, advances construction/upgrading building timers, writes construction completion reports, then records tick completion.
- A richer player-facing construction queue/start-construction flow and training queues remain later Sprint 2 tasks.
- Movement, combat, scouting, notifications, and report-center behavior remain later sprint work.

## Spatial strategy

Prisma handles normal relational data, while PostGIS-heavy actions use raw SQL/TypedSQL.

Examples of PostGIS-heavy actions:

- distance from existing kingdoms
- kingdom overlap checks
- visible polygon area checks
- dynamic buffer checks
- valid land/water/restricted checks later
- nearby valid location suggestions

## Prisma strategy

- Prisma tooling lives in `packages/db`.
- The Prisma schema contains the v0.1 model set for users, kingdoms, districts, stockpiles, buildings, units, land cooldowns, reports, and tick logs.
- The generated Prisma client output path is `packages/db/generated/prisma` and is ignored.
- The first migration enables PostGIS with `CREATE EXTENSION IF NOT EXISTS postgis;`.
- The second migration creates the initial v0.1 relational model foundation.
- The third migration creates `TickLogStatus` and `TickLog`.
- Applying migrations requires a reachable PostgreSQL database with permission to create PostGIS extensions.

## Auth Strategy

- Email/password auth is implemented with first-party Next.js route handlers.
- Passwords use Node `crypto.scrypt` hashes stored in `User.passwordHash`.
- Sessions use signed `mamalik_session` cookies with `SESSION_SECRET`.
- Google OAuth remains a separate Sprint 1 Task 8 implementation.
- Protected dashboard/create-kingdom route behavior remains Sprint 1 Task 9.

## Build Strategy

- `apps/web` uses Turbopack with the repository root configured so it can import repo-local package source from `packages/db`.
- `apps/web` also sets Next.js `outputFileTracingRoot` to the repository root so production builds can trace runtime files from repo-local packages such as `packages/db`.

## Realtime strategy

v0.1 does not need realtime WebSockets. Use simple polling and manual refresh. WebSockets can be added later once the core gameplay is stable.

