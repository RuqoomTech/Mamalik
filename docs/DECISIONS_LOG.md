# Decisions Log

## 2026-06-02 - v0.1 Documentation Foundation

- Decision: v0.1 is the active implementation scope.
- Decision: Sprint 1 is the active sprint.
- Decision: v0.2 docs and Sprint 7-12 artifacts remain future-only until v0.1 is complete.
- Decision: Zero-padded Markdown files are the canonical working docs/tasks for Sprint 1-6.
- Decision: No application code is created in Sprint 1 Task 1 because the repository is not empty and the task is documentation foundation.
- Decision: Next implementation task is minimum project setup for Next.js, TypeScript, Tailwind, Prisma, and the intended repo structure.

## 2026-06-02 - Sprint 1 Initial Prisma Models

- Decision: Sprint 1 Task 6 implements only `User`, `Kingdom`, `District`, `ResourceStockpile`, `BuildingInstance`, `UnitStack`, `LandPurchaseCooldown`, and `Report`.
- Decision: Queue, tick, movement, combat, alliance, ranking, and full report-center models remain deferred to their owning v0.1 sprint tasks.
- Decision: The initial `User` model stores email/password and Google login fields directly with `passwordHash` and `googleSubject`; a separate auth account-linking model is deferred unless v0.1 needs it.
- Decision: The initial `AreaType` enum contains only `STANDARD`. Additional area categories can be added when v0.1 land pricing needs them; area-type bonuses remain post-v0.1.

## 2026-06-07 - Sprint 1 Email Password Auth

- Decision: Sprint 1 Task 7 uses first-party Next.js route handlers for email/password register, login, and logout.
- Decision: Password hashes use Node `crypto.scrypt` with the stored format `scrypt:v1:<salt>:<hash>`.
- Decision: Sessions use signed `mamalik_session` cookies with `SESSION_SECRET` and no session table for the first v0.1 auth slice.
- Decision: Google login remains deferred to Sprint 1 Task 8, and protected route behavior remains deferred to Sprint 1 Task 9.
- Decision: Turbopack uses the repository root so `apps/web` can build against `packages/db` source.

## 2026-06-08 - Documentation Drift Cleanup

- Decision: `AGENTS.md` now lists the canonical active documentation and task files for v0.1 Sprint 1-6.
- Decision: Zero-padded Sprint 1-6 docs under `docs/sprints/` remain canonical for active v0.1 sprint planning.
- Decision: `tasks/backlog.md` and `tasks/sprint_01.md` through `tasks/sprint_06.md` remain canonical for active task tracking.
- Decision: Duplicate historical v0.1 docs and task artifacts were moved into `docs/archive/` and `tasks/archive/` and are read-only historical references.
- Decision: v0.2 docs and v0.2 task artifacts remain in place as future-only references and must not drive v0.1 implementation.

## 2026-06-08 - Sprint 1 Google Login

- Decision: Sprint 1 Task 8 uses first-party Next.js route handlers for Google OAuth instead of adding a larger auth framework.
- Decision: Google OAuth state is stored in a short-lived HttpOnly cookie scoped to `/api/auth/google` and verified during callback.
- Decision: Successful Google login reuses the existing signed `mamalik_session` cookie and session payload format.
- Decision: Existing email/password users are linked to Google only when the verified Google email matches and `googleSubject` is empty.
- Decision: Protected route behavior remains deferred to Sprint 1 Task 9.

## 2026-06-08 - Sprint 1 Protected Routes

- Decision: Sprint 1 Task 9 protects `/dashboard`, `/create-kingdom`, and `/admin` with server-side page guards instead of client-only checks.
- Decision: Route guards reuse `getCurrentUser` and the existing signed `mamalik_session` cookie.
- Decision: `/dashboard` requires a signed-in user with a kingdom; signed-in users without a kingdom are redirected to `/create-kingdom`.
- Decision: `/create-kingdom` requires a signed-in user without a kingdom; signed-in users with a kingdom are redirected to `/dashboard`.
- Decision: `/admin` checks `User.role === "ADMIN"` first and supports `ADMIN_EMAILS` as a server-side v0.1 allowlist.
- Decision: Map UI, kingdom creation, and admin read-only views remain deferred to their assigned Sprint 1 tasks.

## 2026-06-16 - Sprint 1 MapLibre Kingdom Location Page

- Decision: Sprint 1 Task 10 uses MapLibre GL JS for the first `/create-kingdom` map-selection page.
- Decision: Map interaction lives in `apps/web/src/components/map/KingdomLocationMap.tsx` as a Client Component while the page keeps the existing server-side no-kingdom route guard.
- Decision: The map requires `NEXT_PUBLIC_MAP_STYLE_URL`; missing configuration is shown as a clear page error instead of silently switching to another map style.
- Decision: Riyadh is the initial map center for the first v0.1 selection slice.
- Decision: Real location validation, visible border preview, and kingdom creation remain deferred to their assigned Sprint 1 and Sprint 4 tasks.

## 2026-06-17 - Sprint 1 Temporary Location Validation

- Decision: Sprint 1 Task 12 implements `POST /api/kingdom/validate-location` as a temporary validation stub, not final land validation.
- Decision: The temporary endpoint requires an authenticated user and rejects users who already own a kingdom.
- Decision: The temporary endpoint validates coordinate presence, numeric values, and world bounds before checking proximity.
- Decision: The temporary proximity check uses a simple TypeScript distance helper with a 250 meter minimum distance against existing `Kingdom.centerLat` and `Kingdom.centerLng`.
- Decision: The temporary preview polygon approximates 50,000 m2 visually while preserving gameplay land credit as exactly 50,000 m2.
- Decision: Sprint 4 replaces temporary proximity and preview behavior with dynamic buffer/PostGIS validation and real visible-border handling.

## 2026-06-17 - Sprint 1 Kingdom Confirmation UI

- Decision: Sprint 1 Task 13 adds only the post-validation confirmation UI; it does not create a kingdom or write starter state to the database.
- Decision: Locked starter-state values are centralized in `packages/game/src/constants.ts` for reuse by the confirmation UI and the future creation API.
- Decision: Kingdom name validation is client-side in S1-013 for immediate feedback, while the S1-014 server creation endpoint must validate the submitted name again.
- Decision: The Create kingdom button remains a placeholder until `POST /api/kingdom/create` is implemented in S1-014.

## 2026-06-17 - Sprint 1 Kingdom Creation Transaction

- Decision: Sprint 1 Task 14 implements `POST /api/kingdom/create` as a first-party Next.js route handler using the existing signed session system.
- Decision: The creation endpoint re-runs temporary location validation server-side and rejects users who already own a kingdom.
- Decision: The endpoint creates the kingdom, five districts, resource stockpile, starter buildings, starter units, land package cooldown rows, and beginner protection timestamp in one transaction, completing S1-014 and S1-015 together.
- Decision: Starter building footprints are simple 1,000 m2 constants per starter building until a later balancing task intentionally changes them.
- Decision: Initial land purchase cooldown rows use `availableAt = now`; cooldown durations apply after purchases are implemented in Sprint 3.
- Decision: Real water validation, restricted-zone validation, PostGIS dynamic buffers, and final visible border generation remain Sprint 4 work.

## 2026-06-17 - Sprint 1 Kingdom Dashboard

- Decision: Sprint 1 Task 16 keeps `/dashboard` as a server component protected by the existing `requireUserWithKingdom` guard.
- Decision: The dashboard is read-only and loads kingdom state directly from the database; it does not implement tick logic, building actions, land buying, combat, scouting, alliances, reports center, or rankings.
- Decision: Dashboard-derived display values such as free land, district free land, enum labels, and beginner-protection remaining time live in `apps/web/src/lib/kingdom/dashboard-data.ts`.

## 2026-06-17 - Sprint 1 Admin Read-Only Views

- Decision: Sprint 1 Task 17 keeps `/admin` as a server component protected by the existing `requireAdmin` guard.
- Decision: The admin panel is read-only and uses limited explicit database selects for users, kingdoms, resources, districts, buildings, units, and latest reports.
- Decision: No admin write, reset, delete, edit, or tick controls are introduced in Sprint 1 Task 17.
- Decision: Admin-derived display values such as enum labels, district free land, and report read/unread state live in `apps/web/src/lib/admin/admin-data.ts`.

## 2026-06-17 - Sprint 1 QA Closure

- Decision: Sprint 1 is considered ready for Sprint 2 implementation from a code, automated-check, and documentation standpoint.
- Decision: Live Sprint 1 smoke validation remains a separate operational requirement because this environment lacks reachable PostgreSQL/PostGIS, Google OAuth credentials, and prepared player/admin accounts.
- Decision: `apps/web` sets Next.js `outputFileTracingRoot` to the repository root so production builds can trace runtime files from repo-local packages such as `packages/db`.
- Decision: Sprint 2 implementation must not start until explicitly requested after this Sprint 1 closure task.

## 2026-06-17 - Sprint 1 UI Stabilization

- Decision: The post-closure UI pass improves existing Sprint 1 pages only; it does not introduce new gameplay, Sprint 2 tick logic, or new admin actions.
- Decision: Shared Mamalik UI primitives in `apps/web/src/app/globals.css` are the current lightweight UI-system convention for page shells, cards, inputs, actions, and tables.
- Decision: Home, auth, dashboard, admin, and create-kingdom surfaces should reuse those primitives for consistency until a later dedicated design-system task intentionally replaces them.

## 2026-06-19 - Google OAuth Public Policy Pages

- Decision: Mamalik exposes `/privacy` and `/terms` as public static pages for Google OAuth publication and user transparency.
- Decision: The public policy pages describe current v0.1 data practices honestly and do not add unsupported legal, payment, or ownership claims.
- Decision: Google OAuth publication should use `${NEXT_PUBLIC_APP_URL}/privacy` and `${NEXT_PUBLIC_APP_URL}/terms` in Google Cloud OAuth consent/app branding settings.
- Decision: Login and register show a policy notice near the Google login entry point without adding unenforced acceptance checkboxes.

## 2026-06-19 - Sprint 1 Auth Compliance Closure

- Decision: Sprint 1 app-side foundation and auth compliance are complete after user-reported manual QA verified public legal pages, auth flows, route guards, kingdom creation, dashboard, admin access, and second-kingdom rejection.
- Decision: Sprint 1 is ready for Sprint 2 implementation when the user explicitly starts Sprint 2.
- Decision: Production Google Cloud OAuth consent/app branding configuration remains an external deployment task and is not a Sprint 1 code blocker.

## 2026-06-19 - Sprint 2 Tick Worker Foundation

- Decision: Sprint 2 starts with a separate `workers/tick-worker` package instead of putting tick processing inside the Next.js app.
- Decision: The first supported worker command is manual `npm run tick:once`; a long-running scheduler remains deferred until the manual tick is stable.
- Decision: Tick keys are stable UTC ISO timestamps rounded down to locked 10-minute slots.
- Decision: `TickLog.tickKey` is unique and is the duplicate-processing guard for v0.1 tick execution.
- Decision: The first tick worker implementation records tick status and counts kingdoms only; resource generation, Food consumption, population effects, construction progress, and training progress remain later Sprint 2 tasks.

## 2026-06-19 - Sprint 2 Resource Generation Formulas

- Decision: Initial v0.1 resource formulas live in `packages/game/src/economy/resource-generation.ts` so worker and future UI/read models can share deterministic game logic.
- Decision: Only `ACTIVE` buildings generate resources; `CONSTRUCTING` and `UPGRADING` buildings produce nothing until their owning queue tasks complete them.
- Decision: S2-003 generates Food from Farms but does not subtract Food consumption. Consumption remains S2-004.
- Decision: Initial formulas clamp invalid population and building levels to non-negative integers instead of throwing during tick processing.

## 2026-06-20 - Sprint 2 Food Consumption Formulas

- Decision: Initial v0.1 Food consumption formulas live in `packages/game/src/economy/food-consumption.ts`.
- Decision: Population consumes `floor(population * 0.02)` Food per processed tick.
- Decision: Army consumption uses unit rates and rounds the total army consumption up with `Math.ceil`.
- Decision: Food cannot go below zero. If generated plus existing Food cannot cover consumption, the worker records a Food shortage and clamps Food to zero.
- Decision: Starvation death, training pause behavior, and shortage penalties remain deferred to later Sprint 2 tasks.

## 2026-06-20 - Sprint 2 Population Effect Breakdowns

- Decision: Resource generation now returns named breakdowns in `packages/game/src/economy/resource-generation.ts` while preserving flat totals for worker stockpile updates.
- Decision: The Money population effect is named `populationTax`.
- Decision: The Manpower population effect is named `populationManpowerGrowth`; this increases the Manpower resource only and does not change the kingdom population count.
- Decision: Tick output reports population tax and population Manpower totals for each processed non-duplicate tick.

## 2026-06-20 - Sprint 2 Construction Progress

- Decision: Sprint 2 Task S2-006 uses existing `BuildingInstance.status` and `constructionRemainingTicks` fields for construction progress instead of adding queue tables yet.
- Decision: Tick processing advances construction after resource generation and Food consumption, so buildings completed this tick begin producing on the next processed tick.
- Decision: `UPGRADING` buildings are treated as already carrying the target `level`; completion sets `status` to `ACTIVE` and leaves `level` unchanged until a richer queue model exists.
- Decision: Completed construction and upgrade timers create `CONSTRUCTION` reports in the same tick transaction.

## 2026-06-20 - Sprint 2 Training Queue Progress

- Decision: Sprint 2 Task S2-007 adds `TrainingQueueStatus` and `TrainingQueueItem` to persist active unit training queues.
- Decision: Tick processing advances training after resource generation, Food consumption, and construction progress, so completed units begin consuming Food on the next processed tick.
- Decision: Completed training queues increment or create a `GARRISON` `UnitStack` and create a `TRAINING` report in the same tick transaction.
- Decision: One-active-training-queue enforcement remains deferred to the future start-training API instead of adding a partial unique index in S2-007.
- Decision: Tick processing uses a 30-second Prisma interactive transaction timeout because live remote database ticks can exceed Prisma's 5-second default while still completing correctly.

## 2026-06-21 - Sprint 2 Dashboard Economy Display

- Decision: Sprint 2 Task S2-008 keeps `/dashboard` read-only and server-rendered while adding current stockpiles, per-tick economy estimates, Food status, active construction/training progress, latest TickLog rows, and latest kingdom reports.
- Decision: Dashboard per-tick estimates reuse `packages/game` resource-generation, Food-consumption, and tick-duration helpers instead of duplicating formulas in UI components.
- Decision: Latest TickLog activity is loaded through the dashboard read model for visibility only; admin-triggered ticks remain S2-009.
- Decision: Player-facing start-construction and start-training actions remain deferred to their owning tasks and are not introduced from the dashboard.

## 2026-06-21 - Sprint 2 Admin Test Tick

- Decision: Sprint 2 Task S2-009 uses a Next.js Server Action for the admin "Run one tick" control instead of adding a public tick-execution route.
- Decision: The Server Action re-checks the current signed-in user and admin authorization before calling the tick worker core.
- Decision: The admin action reuses `runOneTick` from `workers/tick-worker` so CLI and web-triggered manual ticks share duplicate protection and gameplay mutation behavior.
- Decision: Recent TickLog inspection is added to `/admin`; failed historical TickLog rows remain visible and are not deleted or repaired by this task.
- Decision: Automatic scheduling remains deferred; this task only adds one manual admin-triggered tick.

## 2026-06-21 - Sprint 2 Closure

- Decision: Sprint 2 is complete for the manual/admin tick engine, resource generation, Food consumption, population effects, construction progress, training progress, dashboard economy display, and admin TickLog inspection scope.
- Decision: Player-facing start-construction/start-upgrade actions are deferred to a future v0.1 API/UI task because they require request validation, resource costs, slot enforcement, and build/upgrade initiation behavior.
- Decision: Player-facing start-training actions and one-active-training-queue enforcement are deferred to a future v0.1 API/UI task because they require request validation, resource costs, queue creation, and queue-limit enforcement.
- Decision: Automatic scheduling is deferred until the production worker hosting strategy is chosen; Sprint 2 supports manual `tick:once` and admin one-tick execution.
- Decision: Failed TickLog cleanup is deferred. Failed rows remain visible in admin as audit/debug records.
- Decision: Node and `pg` deprecation warnings are non-blocking for Sprint 2 closure and should be revisited during dependency/toolchain maintenance.
- Decision: The 30-second Prisma interactive transaction timeout remains the v0.1 tick-worker convention for remote database reliability.

## 2026-06-23 - Sprint 3 Land Purchase Foundation

- Decision: Sprint 3 land package, pricing, cooldown, and validation formulas live in `packages/game/src/land`.
- Decision: Package keys are `LAND_500`, `LAND_1000`, `LAND_5000`, and `LAND_10000`.
- Decision: The v0.1 land price formula is `ceil(packageSizeM2 * 2 * kingdomSizeMultiplier * areaMultiplier)`.
- Decision: Kingdom size multipliers are `1.0` below 100,000 m2, `1.25` from 100,000 to 499,999 m2, `1.5` from 500,000 to 999,999 m2, and `2.0` at 1,000,000 m2 or more.
- Decision: Area multipliers are `STANDARD = 1.0`, `RURAL = 0.8`, `URBAN = 1.5`, and `STRATEGIC = 2.0`, but v0.1 currently defaults unknown/current persisted area values to `STANDARD`.
- Decision: Existing `LandPurchaseCooldown` rows are reused for cooldown persistence. No duplicate cooldown model or migration is added in S3-001.
- Decision: Player-facing purchase mutation/UI and purchase report creation remain S3-004 through S3-006.

## 2026-06-23 - Sprint 3 Land Purchase Mutation

- Decision: S3-004 uses a Next.js Server Action entry point for authenticated land purchases instead of adding a public route handler.
- Decision: The Server Action calls `apps/web/src/lib/kingdom/land-purchase.ts`, which re-checks authentication and kingdom ownership inside the server path and accepts only a package key from the client.
- Decision: The mutation recalculates package size, price, area type, cooldown, and stockpile eligibility server-side from database state and `packages/game`; client-submitted prices, land values, and cooldowns are not accepted.
- Decision: The purchase transaction subtracts Money, increases `Kingdom.usableLandM2`, updates the matching `LandPurchaseCooldown`, and creates a `LAND_PURCHASE` report in one transaction.
- Decision: S3-004 uses transaction-local rechecks plus conditional stockpile/cooldown updates for v0.1 concurrency safety. Row-level locking is deferred unless production behavior shows a need for stronger hardening.
- Decision: S3-005 is complete with S3-004 because the purchase transaction creates the land purchase report.
- Decision: Real visible-border expansion and map polygon recalculation remain Sprint 4 work; land purchase currently changes gameplay usable land credit only.

## 2026-06-24 - Sprint 3 Land Purchase Dashboard UI

- Decision: S3-006 adds the dashboard land purchase panel without moving pricing or cooldown formulas into React components.
- Decision: The dashboard read model shapes package options server-side with `createLandPurchaseOptions`, including prices, affordability, cooldown state, and disabled reasons.
- Decision: The client land purchase panel submits only `packageKey` to the existing Server Action and displays the action result. It does not submit price, land size, cooldown, current land, Money, or area type.
- Decision: Successful purchases rely on the existing Server Action revalidation of `/dashboard` so Money, usable land, cooldowns, and latest reports refresh from database state.

## 2026-06-24 - Sprint 3 District Land Dashboard View

- Decision: S3-007 keeps the district land dashboard view read-only and does not add reassignment, construction, upgrade, or placement actions.
- Decision: The dashboard read model uses `District.usedLandM2` as the canonical source for district used/free land and does not recalculate usage from `BuildingInstance` rows.
- Decision: `BuildingInstance` rows are used for per-district building counts and building detail display only, avoiding double-counting when `District.usedLandM2` is already maintained.
- Decision: District free land is displayed as `max(allocatedLandM2 - usedLandM2, 0)`, while unallocated usable land is `max(Kingdom.usableLandM2 - sum(District.allocatedLandM2), 0)`.

## 2026-06-24 - Sprint 3 Unused Land Allocation

- Decision: S3-008 implements allocation-only district management: unallocated usable land can be added to one existing district, but allocated land cannot be moved out of a district or between districts.
- Decision: The district allocation Server Action accepts only `districtId` and `amountM2`, then recomputes kingdom usable land, total district allocation, target district allocation, and target district used land from database state.
- Decision: Overused districts may receive unallocated land because that operation can repair overuse without reducing any district allocation.
- Decision: S3-008 uses a serializable transaction and conditional target-district update for v0.1 concurrency safety. Stronger row-locking can be revisited if production contention shows a need.
- Decision: District allocation creates `DISTRICT_ALLOCATION` reports instead of reusing `LAND_PURCHASE`, so report history distinguishes purchased land from district allocation. Migration `000005_district_allocation_report_type` adds the enum value.

## 2026-06-24 - Sprint 3 Closure

- Decision: Sprint 3 is complete for land package constants, deterministic pricing, cooldown validation, authenticated purchase mutation, dashboard purchase UI, district land overview, and allocation-only unused land assignment.
- Decision: Moving allocated land out of districts or between districts remains deferred because the v0.1 Sprint 3 scope only needs adding unallocated usable land into districts.
- Decision: `LAND_PURCHASE` and `DISTRICT_ALLOCATION` reports are sufficient v0.1 history for land changes; a dedicated `LandPurchase` table is deferred until reporting/query needs justify it.
- Decision: Row-level locking is deferred. Sprint 3 keeps transactions, server-side rechecks, conditional stockpile/cooldown updates, and a serializable allocation transaction as the v0.1 safety baseline.
- Decision: Browser smoke for the latest dashboard land UI remains recommended but is not a Sprint 4 blocker when helper/action tests, build checks, and migration deploy verification pass.
- Decision: Visible-border expansion, polygon recalculation, real area classification, water rejection, restricted-zone checks, overlap checks, and PostGIS spatial helpers remain Sprint 4 work.

## 2026-06-24 - Sprint 4 Map Validation Foundation

- Decision: The canonical Sprint 4 doc was moved from `docs/sprints/SPRINT_04_MAP_VALIDATION.md` to `docs/sprints/SPRINT_04_MAP_VALIDATION_BORDERS.md` to match the active task naming without leaving duplicate active sprint docs.
- Decision: S4-001 keeps `Kingdom.visibleBorderGeojson` as GeoJSON storage and does not add a native geometry column or duplicate border field.
- Decision: S4-001 uses parameterized Prisma raw SQL with PostGIS for geodesic buffer preview generation, area measurement, GeoJSON output, and overlap checks against existing kingdom visible borders.
- Decision: The first v0.1 visible-border generator uses a circular buffer radius of `sqrt(area / pi)` for the locked 50,000 m2 target. Later Sprint 4 tasks may improve shape quality without changing gameplay usable land credit.
- Decision: Validation and kingdom creation both rerun server-side PostGIS validation; client-submitted polygon, area, overlap, or tolerance values are not trusted.
- Decision: Water and restricted-zone checks remain explicit `NOT_IMPLEMENTED` placeholders until their owning Sprint 4 tasks add datasets/checks.

## 2026-06-24 - Sprint 4 Water Rejection Foundation

- Decision: S4-002 adds a raw SQL `LandMaskPolygon` table with PostGIS `geometry(MultiPolygon, 4326)` and a GiST index instead of forcing Prisma to model geometry columns.
- Decision: The first land-mask source is `MAMALIK_COARSE_V0_1`, a small checked-in seed that rejects obvious open-ocean starts but is not coastline-accurate.
- Decision: Production should replace or augment the coarse seed with Natural Earth 1:50m/1:110m or an equivalent licensed land-mask import from local files, never runtime web fetches from validation endpoints.
- Decision: Missing land-mask data blocks validation and kingdom creation by default; `ALLOW_MISSING_LAND_MASK=true` exists only as a local-development fallback.
- Decision: Water rejection runs before border preview generation and existing-border overlap checks, and kingdom creation reruns the same server-side validation.

## 2026-06-24 - Sprint 4 Restricted-Zone Foundation

- Decision: S4-003 adds a raw SQL `RestrictedZone` table with PostGIS `geometry(MultiPolygon, 4326)` and a GiST index instead of forcing Prisma to model geometry columns.
- Decision: The first restricted-zone source is `MAMALIK_RESTRICTED_V0_1`, a small checked-in artificial fixture seed for validation tests and smoke checks only.
- Decision: The v0.1 validation order is coordinate range, land/water, preview polygon generation, restricted-zone point/polygon checks, then existing kingdom overlap checks.
- Decision: Restricted-zone validation rejects a start when the selected point is inside an enabled zone or when the generated preview polygon intersects an enabled zone.
- Decision: An existing restricted-zone table with zero active rows is clear; a missing restricted-zone table returns `restricted-zone-data-missing` and blocks kingdom creation.
- Decision: User-facing restricted-zone errors stay generic so future sensitive restricted datasets do not leak detailed public information.

## 2026-06-25 - Sprint 4 Overlap Reconciliation

- Decision: S4-004 does not rewrite overlap logic because S4-001 already implemented it and S4-003 live smoke confirmed it.
- Decision: v0.1 foundation overlap detection uses `ST_Intersects` between the generated preview polygon and existing `Kingdom.visibleBorderGeojson` converted with `ST_GeomFromGeoJSON`.
- Decision: Direct visible-border overlap returns the existing `too-close-to-existing-kingdom` no-start reason. Dynamic buffer distance checks beyond direct overlap remain S4-005.
- Decision: Kingdom creation remains protected because `POST /api/kingdom/create` reruns the shared server-side validation and does not accept client-submitted polygon, area, overlap, or tolerance values.

## 2026-06-25 - Sprint 4 Dynamic Spacing And Suggestions

- Decision: S4-005 uses `minimumDistanceM = max(300, ceil(previewRadiusM * 2 + 50))` as the v0.1 dynamic spacing rule. The starting 50,000 m2 preview resolves to 303 meters.
- Decision: Dynamic spacing is checked after direct visible-border overlap and uses PostGIS `ST_DWithin` against existing kingdom centers. Direct overlap and spacing failures both return `too-close-to-existing-kingdom`.
- Decision: Nearby suggestions are generated only on the server for water, restricted-zone, overlap, and dynamic-spacing failures. Invalid coordinate-range errors do not trigger suggestion scans.
- Decision: Suggestion candidates use 300m, 600m, 1,000m, 1,500m, and 2,000m rings with 0/45/90/135/180/225/270/315 degree bearings. The scan validates at most 24 candidates in small batches, and each candidate is revalidated through the same pipeline with recursive suggestions disabled.
- Decision: `/api/kingdom/validate-location` returns up to 3 validated suggestions. `POST /api/kingdom/create` reruns validation without suggestions and never auto-applies a suggested coordinate.

## 2026-06-25 - Sprint 4 Area Type Placeholder

- Decision: S4-006 adds a deterministic server-side area type classifier after coordinate, land/water, preview polygon, restricted-zone, overlap, and dynamic-spacing validation.
- Decision: The v0.1 placeholder returns `areaType: STANDARD`, source `V0_1_DEFAULT`, and confidence `LOW` because no reliable land-use dataset is active.
- Decision: Kingdom creation persists the server-side classification in the existing `Kingdom.areaType` field. The current Prisma enum still only allows `STANDARD`, so no migration is added in S4-006.
- Decision: Land purchase pricing continues to use the server-stored/default `STANDARD` area type. Non-standard pricing and area-type-based dynamic buffer variation remain inactive until a real classifier and enum expansion are introduced.
- Decision: Client-submitted area type values are not trusted or accepted by validation, creation, or land purchase flows.

## 2026-06-26 - Sprint 4 Dynamic Visible Border Tolerance

- Decision: S4-007 keeps the v0.1 visible border as a PostGIS-generated circular buffer, but replaces the single-radius attempt with a bounded dynamic attempt sequence.
- Decision: The generator starts with `sqrt(targetAreaM2 / pi)`, then tries a corrected radius based on measured area, then tries deterministic adjustment factors `0.96`, `0.98`, `1.00`, `1.02`, and `1.04` around the initial radius.
- Decision: The selected preview prefers `STRICT` tolerance first, then `LOOSE`, then `FALLBACK`; within the same tolerance band, the area closest to the 50,000 m2 target wins.
- Decision: `/api/kingdom/validate-location`, nearby suggestions, and `POST /api/kingdom/create` all use the same server-side generator. Client-submitted polygons, visible area, attempt counts, and tolerance values remain untrusted.
- Decision: Visible border area remains a measured map polygon value. Gameplay usable land credit remains exactly 50,000 m2 for starting kingdoms and is not derived from the polygon area.

## 2026-06-26 - Sprint 4 Map Preview UI

- Decision: S4-009 renders only server-generated valid preview polygons on the create-kingdom map. Selecting a new point, starting validation, or receiving an invalid result clears the preview to avoid stale border display.
- Decision: The create-kingdom UI uses explicit validation states: not selected, selected but unvalidated, validating, valid, invalid, and request failed.
- Decision: Validation reason copy is user-facing and generic. Restricted-zone messages do not expose detailed restricted data, while direct border overlap can be described as overlap when the validation result includes overlap metadata.
- Decision: Suggestion clicks update the marker, pan the map, clear stale state, and rerun server validation for the suggested coordinate. Suggestions are never accepted automatically by kingdom creation.
- Decision: Confirmation UI may display visible area, target area, tolerance, and area type for user clarity, but `POST /api/kingdom/create` remains the source of truth and reruns validation server-side.

## 2026-06-27 - Kingdom UI Navigation Refinement

- Decision: The authenticated `/dashboard` is now a command overview, not the full detail surface for every kingdom system.
- Decision: Full kingdom detail is split into focused pages: `/world`, `/economy`, `/land`, `/buildings`, `/army`, and `/reports`.
- Decision: Focused kingdom pages reuse the existing server-side `getKingdomDashboardData` read model and shared panels so formulas and display shaping are not duplicated in UI components.
- Decision: Dashboard and world map previews render stored `Kingdom.visibleBorderGeojson` through a read-only MapLibre component. Client-side geometry remains display-only and is not trusted for gameplay.

## 2026-06-27 - Sprint 4 Closure

- Decision: Sprint 4 is complete for the v0.1 map-validation and starting-border foundation and is ready for Sprint 5.
- Decision: Visible-border expansion after land purchases is deferred as future v0.1 map hardening because land purchases currently change gameplay usable land credit only, and gameplay land credit remains separate from visible border area.
- Decision: Area-type-based buffer variation is deferred until non-`STANDARD` area classification exists. Applying variation while every valid start is low-confidence `STANDARD` would be misleading.
- Decision: Coarse `MAMALIK_COARSE_V0_1` land-mask precision is acceptable for the v0.1 foundation, but production launch hardening needs a reviewed, licensed global land-mask import.
- Decision: Artificial `MAMALIK_RESTRICTED_V0_1` restricted-zone fixtures are acceptable for validating the no-start path, but production launch hardening needs a reviewed, sensitivity-aware restricted-zone dataset.
- Decision: Circular PostGIS preview polygons are acceptable for v0.1 starting-border validation. Cadastral or parcel-like border generation remains future map-fidelity work.
- Decision: PostGIS-heavy map validation continues to use server-only helper modules and parameterized raw SQL, while Prisma remains the relational ORM.
- Decision: Browser smoke is recommended but not blocking for Sprint 4 closure when helper/API tests, PostGIS smoke, build, and type checks pass. A no-kingdom manual browser pass remains recommended before public v0.1 launch.

## 2026-06-28 - Public Marketing UI Refresh

- Decision: The public landing page now uses a reference-inspired marketing shell with parchment surfaces, deep green action controls, gold accents, a kingdom-world hero image, feature cards, trust strip, and footer navigation.
- Decision: Public marketing pages live as static App Router pages at `/features`, `/about`, `/how-to-play`, `/roadmap`, `/updates`, `/careers`, and `/contact`.
- Decision: Public copy may sell the Mamalik fantasy, but it must stay honest about implementation status. Sprint 5 combat and Sprint 6 alliance/ranking systems are described as roadmap work until implemented.
- Decision: The supplied kingdom image is stored as a local public asset at `apps/web/public/brand/mamalik-hero-world.png`; runtime pages must not depend on external image fetches for the landing hero.

## 2026-06-29 - Landing Reference Matching Pass

- Decision: The public landing page should keep the supplied reference's compact central parchment frame, short hero, three-card band, trust strip, and full-width dark green footer as the current public marketing direction.
- Decision: The supplied hero art already contains the reference kingdom-stat card, so the landing page should not render a second stat-card overlay on top of that asset.
- Decision: Landing-page icons are implemented as small inline SVG UI ornaments in the existing React components instead of adding a new icon dependency for this polishing checkpoint.
