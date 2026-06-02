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

Status: the minimal directory skeleton exists. The directories are tracked with placeholder files until Sprint 1 tooling and application code are added.

## App responsibilities

### `apps/web`

- Next.js App Router application
- Public landing pages later
- Auth pages
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

### `packages/game`

- Economy formulas
- Tick logic
- Land price formulas
- Combat formulas
- Unit definitions
- Building definitions
- Research definitions

### `workers/tick-worker`

- Runs every 10 minutes
- Processes resource generation
- Processes food consumption
- Advances construction queues
- Advances training queues
- Advances movement orders
- Resolves battles later
- Creates notifications and reports

## Spatial strategy

Prisma handles normal relational data, while PostGIS-heavy actions use raw SQL/TypedSQL.

Examples of PostGIS-heavy actions:

- distance from existing kingdoms
- kingdom overlap checks
- visible polygon area checks
- dynamic buffer checks
- valid land/water/restricted checks later
- nearby valid location suggestions

## Realtime strategy

v0.1 does not need realtime WebSockets. Use simple polling and manual refresh. WebSockets can be added later once the core gameplay is stable.

