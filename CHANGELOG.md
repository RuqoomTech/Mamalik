# Changelog

All notable Mamalik project changes are recorded here.

## 2026-06-26

### Added

- Added bounded dynamic visible-border generation attempts for Sprint 4 location validation.
- Added helper and PostGIS tests for corrected-radius math, bounded radius attempts, and strict/loose/fallback preview selection.
- Added `targetAreaM2` and bounded attempt count metadata to location-validation responses that include a generated preview.

### Changed

- Updated PostGIS preview generation to try the initial circular radius, a measured-area correction, and deterministic radius adjustment factors before choosing the best server-generated polygon.
- Updated create-kingdom validation UI copy to show player-facing border tolerance labels: Excellent fit, Acceptable fit, and Approximate border.
- Marked S4-007 complete in the Sprint 4 docs and task trackers.

### Deferred

- Visible-border expansion after land purchases remains deferred to later Sprint 4 work.
- Real cadastral parcel shapes and production-grade parcel-style borders remain deferred beyond this v0.1 foundation.

## 2026-06-25

### Added

- Added shared `packages/game` area-type helpers for supported area type values, defaulting, parsing, and display labels.
- Added a server-side Sprint 4 area-type classification placeholder that classifies valid starts as `STANDARD` with `V0_1_DEFAULT` source and low confidence.
- Added area-type classification metadata to valid location-validation responses and displayed the area type on the create-kingdom validation and confirmation panels.
- Added focused area-type helper and classifier tests.
- Added a focused overlap regression test proving generated preview polygons with existing-border overlap return `too-close-to-existing-kingdom` and preserve overlap count metadata.
- Added a server-only dynamic spacing helper using a v0.1 `max(300, ceil(previewRadiusM * 2 + 50))` minimum-distance rule.
- Added PostGIS `ST_DWithin` center-distance checks after direct visible-border overlap validation.
- Added capped server-generated nearby valid suggestions for water, restricted-zone, overlap, and spacing failures.
- Added dynamic-spacing and suggestion tests for radius-based minimum spacing, candidate rings/bearings, suggestion caps, spacing result mapping, and non-recursive validation.

### Changed

- Updated kingdom creation to store the server-side area type classification in the existing `Kingdom.areaType` field while continuing to reject client-provided area-type values.
- Marked S4-006 complete in Sprint 4 docs and task trackers.
- Marked S4-004 complete as overlap validation reconciliation because S4-001 already implemented direct visible-border overlap checks and S4-003 live smoke verified the behavior.
- Documented that direct no-overlap validation uses `ST_Intersects` against stored `Kingdom.visibleBorderGeojson`, while dynamic buffer spacing remains S4-005.
- Updated `/api/kingdom/validate-location` to return up to 3 server-validated nearby suggestions when invalid selections can be repaired nearby.
- Updated the create-kingdom map UI to show suggestion distance, bearing, border tolerance, and visible area when available.
- Marked S4-005 complete and marked nearby valid point suggestions complete because the S4-005 task bundled the basic server-generated suggestion flow.

### Deferred

- Non-standard area type datasets, non-`STANDARD` persistence, area-type bonuses, and area-type-based dynamic buffer variation remain deferred until a real classifier is introduced.
- Area-type buffer classification, visible-border expansion after land purchase, and map preview polish remain pending Sprint 4 follow-up work.

## 2026-06-24

### Added

- Added a raw SQL `RestrictedZone` PostGIS table migration with `geometry(MultiPolygon, 4326)`, enabled/source/category indexes, and a GiST spatial index for Sprint 4 restricted-zone validation.
- Added an artificial `MAMALIK_RESTRICTED_V0_1` restricted-zone seed script and root `npm run db:seed-restricted-zones` command.
- Added restricted-zone validation helpers and tests for missing table, empty table, restricted hits, and point/preview-polygon query behavior.
- Added composed location-validation tests for restricted-zone rejection and missing restricted-zone table behavior.
- Added a raw SQL `LandMaskPolygon` PostGIS table migration with `geometry(MultiPolygon, 4326)` and a GiST spatial index for Sprint 4 water rejection.
- Added a coarse `MAMALIK_COARSE_V0_1` land-mask seed script and root `npm run db:seed-land-mask` command.
- Added `docs/MAP_DATA_SOURCES.md` documenting land-mask source, storage, precision limits, seed flow, and future Natural Earth import direction.
- Added land-mask validation helpers and tests for land hits, water misses, missing data, and local missing-data fallback parsing.
- Added composed location-validation tests for land, water, and missing land-mask data behavior.
- Added Sprint 4 PostGIS map-validation foundation helpers for coordinate validation, circular border radius calculation, tolerance classification, preview polygon generation, area measurement, and overlap checks.
- Added server-side Sprint 4 validation composition for PostGIS-generated border previews with explicit water/restricted-zone placeholder statuses.
- Added focused map helper tests for coordinate validation, 50,000 m2 radius approximation, and tolerance classification.
- Added `docs/sprints/SPRINT_03_REVIEW.md` with Sprint 3 closure status, acceptance criteria, checks, deferred items, migration status, and Sprint 4 readiness.
- Added a dashboard `Buy land` panel that displays all four locked land packages with server-computed price, cooldown, affordability, availability, disabled reason, and purchase action state.
- Added land purchase display helpers for cooldown duration, remaining cooldown, disabled reason labels, and user-facing action result messages.
- Added dashboard read-model support for server-computed land purchase options.
- Added focused tests for dashboard land purchase option shaping and land purchase display helpers.
- Added a read-only dashboard `District land` section with kingdom-level usable, allocated, used, free, and unallocated land totals.
- Added per-district dashboard rows for allocated land, used land, free land, usage percentage, building count, and land status.
- Added focused dashboard read-model tests for district free land clamping, usage percentage, overused status, unallocated land totals, and building counts.
- Added shared district unused-land allocation validation helpers in `packages/game`.
- Added an authenticated dashboard Server Action for assigning unallocated usable land into an existing district.
- Added a dashboard `Allocate unused land` form that submits only district id and amount.
- Added `DISTRICT_ALLOCATION` reports and migration `000005_district_allocation_report_type`.
- Added focused tests for allocation validation, server-side DB recomputation, district ownership, report creation, and dashboard result messages.

### Changed

- Marked S4-003 complete in the active Sprint 4 docs and task trackers.
- Updated `/api/kingdom/validate-location` to reject configured restricted no-start zones after preview polygon generation and before existing kingdom overlap checks.
- Updated `POST /api/kingdom/create` to reject restricted zones and missing restricted-zone validation data when rerunning server-side validation.
- Updated the create-kingdom map UI to show restricted-zone validation reasons.
- Documented the placeholder restricted-zone source, seed flow, validation order, and sensitive-details display policy.
- Marked S4-002 complete in the active Sprint 4 docs and task trackers.
- Updated `/api/kingdom/validate-location` to reject obvious water starts before border preview generation.
- Updated `POST /api/kingdom/create` to reject water and missing land-mask data when rerunning server-side validation.
- Updated the create-kingdom map UI to show water and missing-land-mask validation reasons.
- Documented `ALLOW_MISSING_LAND_MASK` as a local-development-only fallback; production should leave it false/empty.
- Started Sprint 4 and marked S4-001 complete in the active Sprint 4 docs and task trackers.
- Moved the canonical Sprint 4 doc to `docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md` to match the active task naming.
- Updated `/api/kingdom/validate-location` to use PostGIS-backed border preview generation and overlap checks.
- Updated `POST /api/kingdom/create` to rerun the same server-side PostGIS validation and store the server-generated preview polygon and measured visible area.
- Updated the kingdom creation map UI wording to remove stale Sprint 1 stub language and display border tolerance status.
- Refined `AGENTS.md` into a repository contributor guide with project structure, commands, style, testing, documentation workflow, commit/PR guidance, security notes, and anti-drift rules.
- Preserved the mandatory Mamalik v0.1 preflight, canonical documentation sources, documentation update loop, and no-v0.2 scope guard.
- Marked S3-006 complete in the active Sprint 3 docs and task trackers.
- Marked S3-007 complete in the active Sprint 3 docs and task trackers.
- Marked S3-008 complete in the active Sprint 3 docs and task trackers.
- Updated the dashboard status note so land buying is no longer listed as future work.
- Documented `District.usedLandM2` as the dashboard source for district used/free land, with buildings used only for counts and detail display.
- Documented Sprint 3 district management as allocation-only: unallocated usable land can be added to districts, but allocated land is not moved out of districts.
- Closed Sprint 3 from the documentation and task-tracking standpoint after confirming land purchase, reports, dashboard land display, and unused-land allocation scope.
- Documented that reports are sufficient v0.1 land-change history and that a dedicated land purchase history table remains deferred.
- Documented Sprint 3 transaction-local rechecks and conditional updates as the v0.1 land mutation concurrency baseline.

### Deferred

- Production-grade global restricted-zone datasets remain deferred; the current seed is artificial and only validates the no-start-zone foundation.
- Coastline-accurate production land-mask import remains deferred; the current seed is coarse and intended as a foundation.
- Full coastline-accurate water rejection remains deferred until a production land-mask dataset is imported.
- Dynamic area-type buffers, nearby suggestions, and land-purchase visible-border expansion remain pending Sprint 4+ work.
- Moving allocated land out of a district or between districts remains deferred.
- Real visible-border expansion and polygon recalculation remain Sprint 4 work.
- Real map-driven area classification remains Sprint 4 work.
- Stronger row-level locking is deferred unless production contention requires it.

## 2026-06-23

### Added

- Added shared land package constants with stable package keys, labels, sizes, and cooldowns in `packages/game`.
- Added deterministic land pricing helpers for package size, kingdom size multiplier, and area multiplier.
- Added land package cooldown helpers for next-available timestamps and active cooldown checks.
- Added land purchase validation helpers for package, kingdom, stockpile, Money, and cooldown checks.
- Added focused land package, pricing, cooldown, and validation tests.
- Added an authenticated land purchase Server Action backed by a transaction-safe server helper.
- Added read-only land purchase option shaping for the future dashboard UI.
- Added `LAND_PURCHASE` report creation during successful land purchases.
- Added focused land purchase mutation tests for rejection paths, Money/land changes, cooldown updates, duplicate cooldown rejection, and report creation.

### Changed

- Started Sprint 3 and marked S3-001 through S3-003 complete in active task trackers.
- Reused existing `LandPurchaseCooldown` persistence instead of adding a duplicate cooldown model.
- Documented the v0.1 land pricing formula and placeholder area-type behavior.
- Marked S3-004 and S3-005 complete because the purchase mutation and report creation now run in one transaction.
- Documented the land purchase Server Action pattern and v0.1 concurrency boundary.

### Deferred

- Dashboard land purchase UI and district reassignment remain pending Sprint 3 tasks.
- Real visible-border expansion and polygon recalculation remain Sprint 4 work.

### Known issues

- Real map-driven area classification is not implemented; current pricing defaults unknown area values to `STANDARD`.

## 2026-06-21

### Added

- Added read-only dashboard sections for resource stockpiles, per-tick economy estimates, Food status, active construction progress, active training progress, latest TickLog activity, and latest kingdom reports.
- Added dashboard data shaping for net Food, ticks until Food reaches zero, queue duration display, and report summaries.
- Added shared tick-duration display helper tests in `packages/game`.
- Added an admin-only Server Action that runs one manual tick through the existing tick worker core.
- Added Tick Controls and Recent Tick Logs sections to `/admin`.
- Added admin tick authorization tests and TickLog row-shaping tests.
- Added `docs/sprints/SPRINT_02_REVIEW.md` with Sprint 2 closure status, deferred items, migration status, and Sprint 3 readiness.

### Changed

- Reused `packages/game` resource-generation and Food-consumption formulas for dashboard per-tick estimates instead of duplicating formulas in UI components.
- Marked S2-008 complete in Sprint 2 task trackers.
- Marked S2-009 complete in Sprint 2 task trackers.
- Completed Sprint 2 QA, stabilization, and closure review documentation.
- Documented that Sprint 2 closes on worker-side processing, dashboard visibility, and admin/manual tick controls.

### Deferred

- Player-facing start-construction/start-upgrade actions, player-facing start-training actions, one-active-training-queue enforcement, automatic tick scheduling, failed TickLog cleanup tooling, starvation penalties, and deprecation-warning cleanup remain deferred to their owning future v0.1 or maintenance tasks.

### Known issues

- None blocking Sprint 3 start from the Sprint 2 tick-engine standpoint.

## 2026-06-20

### Added

- Added deterministic Food consumption formulas for population and army in `packages/game`.
- Added net Food clamping helper so Food cannot go below zero after a tick.
- Added Food consumption unit tests for population-only consumption, starter kingdom consumption, each v0.1 unit type, invalid quantity clamping, unknown unit rejection, and non-negative Food results.
- Added named resource-generation breakdowns for population tax and population-driven Manpower generation.
- Added tests that confirm starter generation totals remain unchanged while formula breakdown totals stay consistent.
- Added construction progress helpers and tests for active, constructing, upgrading, completion, normalization, and negative-timer cases.
- Added construction progress summaries to tick output.
- Added construction completion report creation during tick processing.
- Added `TrainingQueueStatus` and `TrainingQueueItem` to Prisma with migration `000004_training_queue_items`.
- Added training progress helpers and tests for active, completed, cancelled, completion, normalization, and negative-timer cases.
- Added training progress summaries to tick output.
- Added training completion report creation during tick processing.

### Changed

- Wired `tick:once` to subtract Food consumption after Food generation for each processed kingdom.
- Extended tick output with consumed Food totals and Food shortage count.
- Marked S2-004 complete in Sprint 2 task trackers.
- Extended tick output with population tax and population Manpower summary totals.
- Marked S2-005 complete in Sprint 2 task trackers.
- Wired `tick:once` to decrement `CONSTRUCTING` and `UPGRADING` building timers after generation and Food consumption.
- Marked S2-006 complete in Sprint 2 task trackers.
- Wired `tick:once` to decrement active training queues, complete ready queues, and add trained units to garrison stacks.
- Increased tick worker transaction timeout to 30 seconds for remote database tick reliability.
- Marked S2-007 complete in Sprint 2 task trackers.

### Deferred

- Starvation deaths, training pauses, shortage penalties, player-facing construction start actions, and player-facing start-training actions remain deferred to later Sprint 2 tasks.

### Known issues

- None blocking the next Sprint 2 implementation task.

## 2026-06-19

### Added

- Added public `/privacy` and `/terms` pages for Google OAuth publication.
- Added reusable legal page layout and legal link components.
- Added a Google OAuth publication checklist at `docs/GOOGLE_OAUTH_PUBLICATION_CHECKLIST.md`.
- Added `workers/tick-worker` as the Sprint 2 tick worker package.
- Added stable 10-minute tick key helpers and tick log formatting helpers.
- Added `TickLogStatus` and `TickLog` to Prisma with migration `000003_tick_logs`.
- Added root tick scripts: `tick:once`, `tick:dev`, `tick:test`, and `tick:typecheck`.
- Added worker unit tests for tick key calculation and tick-log helpers.
- Added the first `packages/game` package manifest, TypeScript config, and shared exports.
- Added deterministic resource-generation formulas for Money, Food, Manpower, and Knowledge.
- Added unit tests for population-only generation, starter kingdom generation, inactive buildings, building stacking, and invalid input clamping.

### Changed

- Linked Privacy Policy and Terms of Service from the home, login, and register pages.
- Added a Google-login policy notice near the Google login entry points on `/login` and `/register`.
- Documented Google OAuth publication URLs and remaining Google Cloud Console setup steps.
- Completed Sprint 1 QA/auth compliance closure and marked Sprint 1 ready for Sprint 2.
- Updated Sprint 1 acceptance docs to reflect user-tested auth, routing, kingdom creation, dashboard, admin, and public legal page flows.
- Started Sprint 2 and marked S2-001/S2-002 complete in the active task trackers.
- Updated root `npm run test` to include worker tests after web tests.
- Documented the tick worker command convention, TickLog model, and duplicate tick-key protection.
- Applied migration `000003_tick_logs` to the configured database and verified `npm run tick:once` completes.
- Wired `tick:once` to apply resource generation for each processed kingdom and report generated totals.
- Updated root `npm run test` and `npm run typecheck` to include shared game package checks.

### Fixed

- Filled the missing public policy URL surface required before safely publishing Google OAuth login.
- Removed stale Sprint 1 live-smoke blocker language from active Sprint 1 closure docs.
- Improved `tick:once` failure output when the TickLog schema is missing.

### Deferred

- Google Cloud Console OAuth consent configuration remains an external deployment/setup step.
- Food consumption, population effects beyond the current formula inputs, construction progress, training progress, scheduler behavior, and admin tick controls remain deferred to later Sprint 2 tasks.

### Known issues

- None blocking the next Sprint 2 implementation task. Production Google OAuth publication still requires external Google Cloud Console configuration before public production publishing.

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
- Added `docs/sprints/SPRINT_01_REVIEW.md` for Sprint 1 QA closure.
- Added shared Mamalik UI primitives for page shells, cards, inputs, action buttons, and data tables.

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
- Marked Sprint 1 QA, stabilization, and closure complete in the active task files.
- Completed a post-closure UI stabilization pass for the existing home, login, register, dashboard, admin, and create-kingdom surfaces.
- Updated the signed-in home page to show the existing player destination and admin navigation when applicable.
- Documented the temporary validation behavior and Sprint 4 replacement path.
- Configured Next.js `outputFileTracingRoot` to the repository root so production builds can trace repo-local package runtime files.

### Fixed

- Replaced the local validate-location placeholder message with an actual temporary API call.
- Replaced the confirmation panel's placeholder Create kingdom action with the real Sprint 1 creation request.
- Fixed kingdom name validation so control characters are rejected before whitespace normalization.
- Fixed the Sprint 1 production build failure caused by missing traced Prisma runtime files from `packages/db`.
- Fixed inconsistent Sprint 1 surface styling by applying the shared UI primitives across existing app pages.

### Deferred

- Real water validation, restricted-zone validation, dynamic buffer/PostGIS validation, and real visible border generation remain deferred to their assigned Sprint 4 tasks.
- Sprint 1 admin write controls, reset/delete/edit actions, and admin-triggered ticks remain deferred to later owning tasks.

### Known issues

- Live validate-location route smoke testing requires a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- Live confirmation-flow smoke testing also requires a signed-in no-kingdom account and reachable database.
- Live kingdom creation route and database record smoke testing require a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- Live Google OAuth smoke testing still requires configured Google OAuth credentials.
- Live no-kingdom create-kingdom map/validation/creation smoke testing still requires a prepared signed-in no-kingdom account.
- Live second kingdom rejection and non-admin admin-denial smoke tests still require prepared account states.

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
