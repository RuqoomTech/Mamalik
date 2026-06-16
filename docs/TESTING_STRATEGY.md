# Testing Strategy

## Baseline

The `apps/web` Next.js foundation exists. Root npm scripts delegate to app-local checks in `apps/web`.

## Expected Checks By Work Type

| Work type | Checks |
|---|---|
| Repository/docs | `rg --files`, `git diff --check` |
| Environment examples | `rg --files -g ".env.example"`, `git check-ignore -q apps/web/.env.example` should exit as not ignored, and local secret files should stay ignored |
| TypeScript app | `npm run typecheck`, `npm run lint`, `npm run build`, unit tests where available |
| Auth helpers | `npm run test`, plus route smoke checks when a database is available |
| Prisma schema | `npm run db:validate`, `npm run db:generate`, migration validation when a database is available |
| Game formulas | unit tests for deterministic outputs and edge cases |
| API routes | unit/integration tests where practical plus manual API smoke notes |
| Map/spatial logic | unit tests for helpers, PostGIS validation, manual map smoke notes |
| Worker/tick logic | unit tests for tick formulas, manual one-tick run, tick log verification |
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
- Dashboard/admin manual smoke checks.

## Documentation Requirement

Every task must record:

- Commands run.
- Result of each check.
- Why any expected check could not run.
- Known issues and residual risk.
