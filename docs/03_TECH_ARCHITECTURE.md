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

Status: `apps/web`, `packages/db`, `packages/game`, and `workers/tick-worker` now contain implementation code. `workers/tick-worker` supports manual one-tick execution and admin-triggered one-tick execution in Sprint 2; automatic scheduler behavior remains deferred until the production worker hosting strategy is chosen.

## Package manager

- Current package manager: npm.
- Root scripts delegate to `apps/web`.
- Web dependencies are app-local under `apps/web`.
- Shared package manifests can be added when `packages/db`, `packages/game`, `packages/config`, or `workers/tick-worker` receive implementation code.
- Root scripts now include `tick:once`, `tick:dev`, `tick:test`, and `tick:typecheck`.
- Root scripts now include `game:test` and `game:typecheck` for shared game-domain logic.
- `tick:once` is the first supported tick command and should be stabilized before relying on a long-running scheduler.
- Tick worker database processing uses a 30-second Prisma interactive transaction timeout for remote database reliability.
- Automatic recurring scheduling is not part of Sprint 2 closure. The stable manual/admin tick path is the current supported operation mode.

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

Sprint 2 dashboard data stays server-side and read-only. `apps/web/src/lib/kingdom/dashboard-data.ts` loads kingdom state, active queue state, latest reports, and latest TickLog rows, then reuses `packages/game` formulas for display-only per-tick estimates.

Sprint 3 land purchase mutations use a Next.js Server Action that calls a server-side helper in `apps/web/src/lib/kingdom/land-purchase.ts`. The action accepts only a package key, re-checks authentication/kingdom ownership inside the server path, and recalculates price, cooldown, and area type server-side before mutating the database.

Sprint 3 dashboard land purchase UI keeps pricing/cooldown calculation server-side. `dashboard-data.ts` shapes package options with `createLandPurchaseOptions`, and the client panel submits only `packageKey` to the Server Action.

Sprint 3 district allocation uses the same Server Action pattern. The dashboard client panel submits only `districtId` and `amountM2`; `apps/web/src/lib/kingdom/district-allocation.ts` reloads kingdom and district state server-side, recomputes unallocated usable land, and updates the target district in a transaction. It does not move land out of districts.

Sprint 4 map validation introduces server-only PostGIS helpers under `apps/web/src/lib/map`. Pure tolerance/radius helpers live in `border-generation.ts`; raw SQL helpers live in `postgis.ts`; route-level composition lives in `location-validation.ts`. These helpers use parameterized raw SQL and convert stored GeoJSON to geometry for overlap checks instead of adding duplicate geometry columns in S4-001.

S4-002 adds `apps/web/src/lib/map/land-mask.ts` for land/water checks against the raw SQL `LandMaskPolygon` PostGIS table. The helper checks the table exists, detects missing seed data explicitly, uses `ST_Covers` for point-in-land checks, and blocks water before border preview generation unless the local-development-only missing-data fallback is enabled.

S4-003 adds `apps/web/src/lib/map/restricted-zones.ts` for configured no-start zones against the raw SQL `RestrictedZone` PostGIS table. The helper treats a missing table as explicit data missing, treats an existing empty table as clear, and rejects locations when either the selected point is covered by a zone or the generated preview polygon intersects a zone.

S4-004 reconciles overlap tracking without rewriting the helper. Direct visible-border overlap is complete for the v0.1 foundation and returns the existing `too-close-to-existing-kingdom` no-start reason. Dynamic buffer distance checks beyond direct overlap remain a separate Sprint 4 task.

Sprint 2 admin tick control uses a Next.js Server Action from `/admin`, re-checks admin authorization inside the action path, and calls the same `runOneTick` worker core used by the CLI. No public tick-execution route is exposed.

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

Status: Sprint 2 added the first package manifest, TypeScript config, exports, deterministic resource-generation formulas with named population-effect breakdowns, deterministic Food consumption formulas, construction progress helpers, training progress helpers, and tick-duration display helpers. Sprint 3 adds land package, pricing, cooldown, validation, and district unused-land allocation helpers.

### `workers/tick-worker`

- Lives outside the web app as a separate worker package/process.
- Computes stable 10-minute tick keys.
- Writes persistent `TickLog` rows with duplicate tick protection.
- `tick:once` currently generates Money, Food, Manpower, and Knowledge for each processed kingdom, reports named population tax and population Manpower contributions, subtracts Food consumption for population and army, clamps Food at zero, advances construction/upgrading building timers, advances active training queue timers, writes construction/training completion reports, then records tick completion.
- `/admin` can trigger the same one-tick core through an admin-only Server Action; duplicate processing is still guarded by `TickLog.tickKey`.
- A richer player-facing construction queue/start-construction flow and player-facing start-training API/UI remain deferred v0.1 tasks outside Sprint 2 closure.
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

S4-001 keeps visible border storage in `Kingdom.visibleBorderGeojson` as GeoJSON and uses PostGIS functions such as `ST_Buffer`, `ST_Area`, `ST_AsGeoJSON`, `ST_GeomFromGeoJSON`, and `ST_Intersects` through parameterized Prisma raw SQL. A native geometry column or spatial index can be added later if performance requires it.

S4-002 stores the coarse land mask in `LandMaskPolygon.geom` as `geometry(MultiPolygon, 4326)` with a GiST index. Prisma does not model this geometry table directly; migrations and seed scripts manage it, and app helpers query it with parameterized raw SQL.

S4-003 stores configured no-start fixtures in `RestrictedZone.geom` as `geometry(MultiPolygon, 4326)` with a GiST index. Prisma does not model this geometry table directly; migrations and seed scripts manage it, and app helpers query it with parameterized raw SQL.

## Prisma strategy

- Prisma tooling lives in `packages/db`.
- The Prisma schema contains the v0.1 model set for users, kingdoms, districts, stockpiles, buildings, units, land cooldowns, reports, and tick logs.
- The generated Prisma client output path is `packages/db/generated/prisma` and is ignored.
- The first migration enables PostGIS with `CREATE EXTENSION IF NOT EXISTS postgis;`.
- The second migration creates the initial v0.1 relational model foundation.
- The third migration creates `TickLogStatus` and `TickLog`.
- The fourth migration creates `TrainingQueueStatus` and `TrainingQueueItem`.
- The fifth migration adds the `DISTRICT_ALLOCATION` report type for district-land allocation reports.
- The sixth migration creates the raw SQL `LandMaskPolygon` PostGIS table and spatial index for water rejection.
- The seventh migration creates the raw SQL `RestrictedZone` PostGIS table and spatial index for no-start zone validation.
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

