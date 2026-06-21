# Testing Strategy

## Baseline

The `apps/web` Next.js foundation exists. Root npm scripts delegate to app-local checks in `apps/web`, DB checks in `packages/db`, and worker checks in `workers/tick-worker` through app-local TypeScript tooling.

## Expected Checks By Work Type

| Work type | Checks |
|---|---|
| Repository/docs | `rg --files`, `git diff --check` |
| Environment examples | `rg --files -g ".env.example"`, `git check-ignore -q apps/web/.env.example` should exit as not ignored, and local secret files should stay ignored |
| TypeScript app | `npm run typecheck`, `npm run lint`, `npm run build`, unit tests where available |
| Auth helpers | `npm run test`, plus route smoke checks when a database is available |
| Prisma schema | `npm run db:validate`, `npm run db:generate`, migration validation when a database is available |
| Game formulas | `npm run game:test`, `npm run game:typecheck`, deterministic unit tests for outputs and edge cases |
| API routes | unit/integration tests where practical plus manual API smoke notes |
| Map/spatial logic | unit tests for helpers, PostGIS validation, manual map smoke notes |
| Worker/tick logic | `npm run tick:test`, `npm run tick:typecheck`, manual `npm run tick:once` when a migrated PostgreSQL/PostGIS database is reachable |
| UI flows | manual smoke notes until E2E tests are introduced |

## Sprint 1 Testing Priorities

- Tooling checks after project setup: `npm run typecheck`, `npm run lint`, `npm run build`.
- Environment examples check: confirm `.env.example` exists and real `.env*` files stay ignored.
- Prisma validation after database foundation: `npm run db:validate`, `npm run db:generate`, `npm run db:typecheck`.
- Migration application after database foundation requires local PostgreSQL/PostGIS access.
- Auth helper unit tests after auth.
- Auth route smoke checks after auth when a PostgreSQL/PostGIS database is reachable.
- Temporary kingdom location validation helper tests after S1-012.
- Kingdom name validation and starter-state constant tests after S1-013.
- Kingdom creation helper tests for slug generation, protection duration, starter district total, resources, units, and package constants after S1-014/S1-015.
- Kingdom creation API integration tests require a reachable PostgreSQL/PostGIS database.
- Dashboard helper tests for free land, protection remaining time, and dashboard data shaping after S1-016.
- Admin helper tests for enum labels, district free land, report read state, and read-model shaping after S1-017.
- Dashboard/admin manual smoke checks.

## Sprint 2 Testing Priorities

- Tick key calculation and tick-log helper unit tests after S2-001/S2-002.
- Resource-generation formula tests after S2-003.
- Food consumption formula and net-Food clamping tests after S2-004.
- Resource-generation breakdown tests after S2-005 should verify population tax, population-driven Manpower, unchanged starter totals, inactive-building behavior, and breakdown-total consistency.
- Construction progress tests after S2-006 should verify active buildings do not progress, constructing/upgrading timers decrement, completed buildings activate, stale zero-tick rows normalize, and timers never go negative.
- Training progress tests after S2-007 should verify active queues decrement, active queues complete at zero, stale zero-tick queues normalize, completed/cancelled queues do not progress, unit stacks receive completed quantities, and duplicate ticks do not train units twice.
- Dashboard economy tests after S2-008 should verify per-tick estimates use formula totals, net Food and Food status are calculated correctly, active construction/training rows are shaped for display, latest TickLog rows are exposed, and report summaries remain display-only.
- `npm run test` now includes web tests, `npm run game:test`, and `npm run tick:test`.
- `npm run typecheck` now includes web typecheck and `npm run game:typecheck`; `npm run tick:typecheck` validates the separate worker TypeScript package.
- `npm run tick:once` is the manual smoke command for the worker, but it requires `DATABASE_URL` and the TickLog migration applied to a reachable database.
- Construction and training tests should be added with the owning Sprint 2 tasks.

## Documentation Requirement

Every task must record:

- Commands run.
- Result of each check.
- Why any expected check could not run.
- Known issues and residual risk.
