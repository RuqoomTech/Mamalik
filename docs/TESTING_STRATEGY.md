# Testing Strategy

## Baseline

No application code exists yet. Sprint 1 project setup must add the first runnable checks.

## Expected Checks By Work Type

| Work type | Checks |
|---|---|
| Repository/docs | `rg --files`, `git diff --check` |
| TypeScript app | typecheck, lint, unit tests where available |
| Prisma schema | Prisma validate, migration validation |
| Game formulas | unit tests for deterministic outputs and edge cases |
| API routes | unit/integration tests where practical plus manual API smoke notes |
| Map/spatial logic | unit tests for helpers, PostGIS validation, manual map smoke notes |
| Worker/tick logic | unit tests for tick formulas, manual one-tick run, tick log verification |
| UI flows | manual smoke notes until E2E tests are introduced |

## Sprint 1 Testing Priorities

- Tooling checks after project setup.
- Prisma validation after database foundation.
- Auth route smoke checks after auth.
- Kingdom creation API validation and starter state checks.
- Dashboard/admin manual smoke checks.

## Documentation Requirement

Every task must record:

- Commands run.
- Result of each check.
- Why any expected check could not run.
- Known issues and residual risk.
