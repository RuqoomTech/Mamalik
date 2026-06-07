# Changelog

All notable Mamalik project changes are recorded here.

## 2026-06-07

### Added

- Added email/password register, login, and logout route handlers.
- Added `/register` and `/login` pages.
- Added signed `mamalik_session` cookie helpers and `crypto.scrypt` password hashing.
- Added focused auth unit tests and app-local `tsx` test runner support.
- Added `docs/AUTHENTICATION.md`.
- Added a generated v0.1 logo mark at `apps/web/public/brand/mamalik-logo.png`.
- Added `docs/BRAND_ASSETS.md`.

### Changed

- Marked Sprint 1 Task S1-007 complete in the active task files.
- Updated architecture, environment, testing, sprint, context, and decision docs for first-party email/password auth.
- Updated app metadata and the home page to use the Mamalik logo mark.

### Fixed

- Configured the web build root so Turbopack can build repo-local `packages/db` imports.

### Deferred

- Google login is deferred to Sprint 1 Task 8.
- Protected dashboard/create-kingdom route behavior is deferred to Sprint 1 Task 9.

### Known issues

- No live database setup exists yet.
- `npm install` for the web app reported two moderate npm audit findings after adding `tsx`.
- Live register/login route smoke tests require a reachable database and were not run in this environment.

## 2026-06-02

### Added

- Added persistent Codex instructions in `AGENTS.md`.
- Added long-term project memory in `context.md`.
- Added live working memory in `session_state.md`.
- Added canonical v0.1 documentation files for locked decisions, scope, architecture, data model, sprint plan, definition of done, testing strategy, and decisions log.
- Added canonical Sprint 1-6 Markdown files under `docs/sprints/`.
- Added canonical task Markdown files under `tasks/`.
- Added the minimal Sprint 1 monorepo directory skeleton: `apps/web`, `packages/db`, `packages/game`, `packages/config`, and `workers/tick-worker`.
- Added the Next.js 16 web app foundation in `apps/web` with TypeScript, Tailwind, ESLint, App Router, npm, and `src/`.
- Added root npm forwarding scripts for `dev`, `build`, `lint`, and `typecheck`.
- Added `apps/web/.env.example` with placeholders for app URL, database, auth, map, admin, and tick worker settings.
- Added `docs/ENVIRONMENT.md` for local environment setup and secret handling.
- Added `packages/db` Prisma/PostgreSQL/PostGIS foundation with package-local dependencies, config, schema, PostGIS migration, and environment example.
- Added root DB scripts for Prisma validation, generation, migrations, Studio, and DB package typecheck.
- Added `docs/DATABASE.md`.
- Added initial v0.1 Prisma enums and models for `User`, `Kingdom`, `District`, `ResourceStockpile`, `BuildingInstance`, `UnitStack`, `LandPurchaseCooldown`, and `Report`.
- Added `packages/db/prisma/migrations/000002_initial_v0_1_models/migration.sql`.

### Changed

- Clarified that Sprint 1 is the active sprint and v0.1 is the active release.
- Clarified that existing v0.2 material is future-only until v0.1 is complete.
- Marked Sprint 1 Task S1-002 complete in the active task files.
- Marked Sprint 1 Task S1-003 complete in the active task files.
- Marked Sprint 1 Task S1-004 complete in the active task files.
- Marked Sprint 1 Task S1-005 complete in the active task files.
- Marked Sprint 1 Task S1-006 complete in the active task files.
- Recorded npm as the current package manager convention.
- Clarified that real `.env*` files stay ignored while `.env.example` is trackable.
- Updated the data-model, architecture, database, sprint, and context documentation for the initial Prisma model foundation.

### Fixed

- Filled missing required repository memory files.

### Deferred

- Game code implementation is deferred until after the repository foundation is locked.
- Queue, tick, movement, combat, alliance, ranking, and full report-center models remain deferred to later v0.1 sprint tasks.

### Known issues

- No live database setup or automated test runner exists yet.
- Legacy unpadded sprint docs and generated JSON/CSV task files remain present as reference artifacts.
- `npm run build` currently emits a Node deprecation warning for `module.register()` under Node v26.1.0, but the build passes.
- Local `psql` and Docker are not available in the current environment, so the PostGIS migration has not been applied locally.
- `npm install` for the DB package reported three moderate npm audit findings.
- Prisma `migrate diff` did not emit SQL from the local schema in this toolchain, so the S1-006 model migration was added manually from the validated Prisma schema.
