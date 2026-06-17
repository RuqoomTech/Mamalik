# Changelog

All notable Mamalik project changes are recorded here.

## 2026-06-17

### Added

- Added `POST /api/kingdom/validate-location` as a temporary Sprint 1 validation endpoint.
- Added reusable temporary location validation helpers for coordinate validation, distance checks, suggestions, and preview polygon generation.
- Added shared game constants for starting usable land, temporary visible area, and temporary minimum kingdom distance.
- Added unit tests for temporary kingdom location validation helpers.
- Added an editable `/create-kingdom` confirmation panel after successful location validation.
- Added shared starter-state constants for resources, population, districts, buildings, units, and beginner protection.
- Added kingdom name validation helpers and focused tests.
- Added `POST /api/kingdom/create` with authenticated, server-side kingdom creation.
- Added a database transaction that creates the kingdom, five districts, resource stockpile, starter buildings, starter units, land package cooldown rows, and beginner protection timestamp.
- Added kingdom creation helpers and tests for slug generation, protection duration, starter district totals, starter units, and land package constants.
- Added a read-only `/dashboard` kingdom overview loaded server-side from the database.
- Added dashboard data helpers and tests for free land, district free land, beginner-protection remaining time, and dashboard data shaping.
- Added a read-only `/admin` panel for Sprint 1 foundation inspection.
- Added admin overview counts plus users, kingdoms, resources, districts, buildings, units, and reports preview tables.
- Added admin data helpers and tests for enum labels, district free land, report read state, and read-model shaping.

### Changed

- Wired the `/create-kingdom` validate button to call the temporary validation endpoint and show loading, success, invalid reason, and suggestions.
- Updated `/create-kingdom` to show selected coordinates, validation status, land values, preview polygon summary, locked starter state, editable kingdom name, and a placeholder Create kingdom action after validation succeeds.
- Wired the `/create-kingdom` confirmation panel to call `POST /api/kingdom/create`, show loading/errors, and redirect to `/dashboard` on success.
- Expanded starter constants so the UI and creation route share server-usable enum values, labels, building footprints, and land purchase package data.
- Confirmed S1-011 was already completed by the S1-010 map slice and left it marked complete in the active task trackers.
- Marked Sprint 1 Task S1-012 complete in the active task files.
- Marked Sprint 1 Task S1-013 complete in the active task files.
- Marked Sprint 1 Tasks S1-014 and S1-015 complete in the active task files.
- Marked Sprint 1 Task S1-016 complete in the active task files.
- Marked Sprint 1 Task S1-017 complete in the active task files.
- Documented the temporary validation behavior and Sprint 4 replacement path.

### Fixed

- Replaced the local validate-location placeholder message with an actual temporary API call.
- Replaced the confirmation panel's placeholder Create kingdom action with the real Sprint 1 creation request.
- Fixed kingdom name validation so control characters are rejected before whitespace normalization.

### Deferred

- Real water validation, restricted-zone validation, dynamic buffer/PostGIS validation, and real visible border generation remain deferred to their assigned Sprint 4 tasks.
- Sprint 1 admin write controls, reset/delete/edit actions, and admin-triggered ticks remain deferred to later owning tasks.

### Known issues

- Live validate-location route smoke testing requires a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- Live confirmation-flow smoke testing also requires a signed-in no-kingdom account and reachable database.
- Live kingdom creation route and database record smoke testing require a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- Live dashboard smoke testing requires a reachable PostgreSQL/PostGIS database and signed-in account that owns a kingdom.
- Live admin panel smoke testing requires a reachable PostgreSQL/PostGIS database and admin account.

## 2026-06-16

### Added

- Added MapLibre GL JS to the web app.
- Added the first protected `/create-kingdom` map-selection page.
- Added a client-side `KingdomLocationMap` component with pan, zoom, click selection, selected marker, coordinate display, search placeholder, and local validate-location placeholder message.

### Changed

- Marked Sprint 1 Tasks S1-010 and S1-011 complete in the active task files because the S1-010 instructions included the S1-011 map interaction requirements.
- Documented active MapLibre environment configuration and the no-fallback map-style behavior.

### Fixed

- Replaced the S1-009 `/create-kingdom` placeholder with the first usable map-selection surface.

### Deferred

- Server-side temporary location validation remains Sprint 1 Task S1-012.
- Editable kingdom name confirmation, kingdom creation transaction, starter state seeding, real land validation, visible border generation, and gameplay systems remain deferred to their assigned tasks.

### Known issues

- Live map smoke testing requires a signed-in no-kingdom user and reachable PostgreSQL/PostGIS database.
- `npm --prefix apps/web install maplibre-gl` reported 3 npm audit findings: 2 moderate and 1 high.

## 2026-06-08

### Added

- Added server-side route guard helpers for authenticated app routes.
- Added `/dashboard`, `/create-kingdom`, and `/admin` Sprint 1 placeholder pages.
- Added post-login destination and admin allowlist helpers.
- Added focused auth tests for kingdom-based destination selection and admin access checks.
- Added first-party Google OAuth start and callback route handlers.
- Added short-lived Google OAuth state cookie helpers.
- Added Google identity normalization and user upsert/linking logic.
- Added "Continue with Google" links to `/login` and `/register`.
- Added focused auth tests for OAuth state, Google authorization URL creation, identity normalization, and user linking/creation.
- Added `docs/archive/` for historical duplicate documentation.
- Added `tasks/archive/` for historical duplicate task artifacts.
- Added archive README files explaining that archived materials are read-only historical references.

### Changed

- Marked Sprint 1 Task S1-009 complete in the active task files.
- Documented protected route behavior and admin allowlist behavior.
- Redirect signed-in `/login` and `/register` visitors to `/create-kingdom` or `/dashboard`.
- Marked Sprint 1 Task S1-008 complete in the active task files.
- Documented Google OAuth configuration, callback URI, state cookie behavior, and account-linking behavior.
- Added canonical documentation and task source guidance to `AGENTS.md`.
- Recorded the canonical documentation convention in `context.md` and `docs/DECISIONS_LOG.md`.
- Moved legacy duplicate v0.1 docs and duplicate Sprint 1-6 task artifacts into archive folders.

### Fixed

- Reduced documentation drift by keeping zero-padded Sprint 1-6 docs and Markdown task files as the active source of truth.

### Deferred

- MapLibre kingdom creation UI remains Sprint 1 Task 10.
- Full admin read-only views remain Sprint 1 Task 17.

### Known issues

- Live protected route smoke testing requires a reachable PostgreSQL/PostGIS database.
- Live Google OAuth smoke testing requires configured Google OAuth credentials, matching callback URI, and a reachable PostgreSQL/PostGIS database.
- v0.2 docs and task artifacts remain future-only references.
- Export/reference backlog files remain in place and are not active task trackers.

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
