# Mamalik Context

Long-term project memory for Mamalik / ممالك.

## Project Summary

Mamalik is an original browser-based, tick-based grand strategy MMO on a global real-world map. Players create kingdoms on valid land, receive a starting usable land credit, grow through districts and buildings, train armies, scout and fight, form simple alliances, receive reports, and compete through persistent rankings.

Mamalik is inspired by the genre of tick-based web strategy games, but it must not copy any existing game's code, UI, art, text, branding, or protected expression.

## Active Release

- Active milestone: v0.1
- Active sprint: Sprint 4 - Map Validation + Borders is closed and ready for Sprint 5 when the user starts it.
- Active task sequence: Sprint 1, Sprint 2, Sprint 3, and Sprint 4 are complete from the documented feature and automated-check standpoint. Sprint 4 delivered PostGIS-backed preview polygon generation, area measurement, overlap checks, coarse land-mask water rejection, placeholder restricted-zone no-start validation, dynamic spacing checks, server-generated nearby valid suggestions, the server-side `STANDARD` area-type placeholder, bounded dynamic visible-border tolerance generation, create-kingdom map preview UI, and the overview-plus-detail kingdom UI split. Visible-border expansion after land purchases, production map datasets, and area-type buffer variation remain future v0.1 map-hardening work.
- v0.2 material in this repository is future-only and must not drive implementation until v0.1 is complete

## Locked v0.1 Scope

v0.1 must include:

- Register/login
- Google login
- Real-world map screen
- Search, pan, and click location selection
- Valid kingdom creation
- Starting kingdom with 50,000 m2 usable land credit
- Real land parcel style visible borders, simplified or stubbed at first
- Land credit system
- District system
- Starting buildings
- Starting units
- 10-minute tick economy
- Population and Food consumption
- Building construction and upgrades
- Unit training
- Land buying packages, prices, and cooldowns
- Distance-based army movement
- Basic combat
- Approximate scouting
- Reports
- Rankings
- Simple alliances
- Admin panel

## Deferred Until After v0.1

- WebSockets/realtime
- Full chat
- Area-type bonuses
- Wood, Stone, and Iron
- Advanced diplomacy
- Payments/premium
- Mobile app
- Manual building placement
- Advanced battle tactics

## Locked Gameplay Decisions

### World

- Global real-world map from day one.
- Players can start anywhere globally if the location is valid.
- Valid land excludes water, restricted zones, impossible geometry, overlap, and invalid border generation.
- World is persistent and endless.
- There are no seasons and no final victory condition.
- Progression is leaderboard-based.

### Land

- Starting usable land credit is 50,000 m2.
- Visible border is a virtual polygon.
- Gameplay land credit and visible border area are separate.
- Visible border generation uses dynamic tolerance:
  - Try 49,000-51,000 m2.
  - Then try 45,000-55,000 m2.
  - Then use a fallback generated polygon.
- Land buying uses fixed packages:
  - 500 m2: no cooldown
  - 1,000 m2: 6 hours
  - 5,000 m2: 24 hours
  - 10,000 m2: 48 hours
- Land price depends on kingdom size and area type.
- War land capture allows a winner to gain 1,000 m2 usable land credit from the same enemy player once per 30 days.

### Kingdom Creation

- Player searches or pans the map, clicks a point, validates it, then confirms creation.
- Invalid locations should return useful reasons and suggest nearby valid points.
- Kingdom naming is hybrid: suggested from player/location and editable before confirmation.

### Protection

- Beginner protection lasts 3 days.
- Protected kingdoms cannot attack players.
- Protected kingdoms cannot be attacked.
- Protected kingdoms cannot be scouted by players.
- Protected kingdoms can build, train, buy land, prepare, and later scout NPC/wild areas.

### Districts

- Buildings are not manually placed on the map.
- Buildings consume land inside districts.
- Districts are Economic, Military, Residential, Research, and Defensive.
- Starting allocation:
  - Economic: 15,000 m2
  - Residential: 12,000 m2
  - Military: 8,000 m2
  - Defensive: 8,000 m2
  - Research: 7,000 m2
- Allocation is fixed at start and editable later using unused land.

### Starting State

- Money: 10,000
- Food: 5,000
- Manpower: 500
- Knowledge: 0
- Population: 1,000
- Army: 100 Infantry and 25 Archers

### Economy

- Resources are Money, Food, Manpower, and Knowledge.
- Money comes from taxes and markets.
- Food comes from farms and population support.
- Manpower comes from population and houses.
- Knowledge comes from scholar/research buildings.
- Resources generate every 10-minute tick.
- Population and army consume Food every tick.

### Buildings And Units

- Buildings have levels.
- Construction and upgrades are measured in ticks.
- There is 1 active construction slot at start.
- There is 1 active training queue at start.
- v0.1 buildings: Farm, Market, Tax Office, Palace, Houses, Barracks, Stables later, Watchtower, Wall, Scholar Hall.
- v0.1 units: Infantry, Archers, Cavalry, Scouts, Siege.
- Research uses a simple tech tree.

### Combat

- Armies take distance-based travel time.
- Global attacks are allowed, but far attacks are slow and expensive.
- v0.1 battle formula is simple attack power versus defense power.
- Defenders get bonuses from Wall, Watchtower, Defensive District, Defense tech, and garrisoned units.
- Scouts reveal approximate enemy information.
- Siege is required to seriously damage high-level walls.

### Alliances And Rankings

- Alliances are simple in v0.1: create, join, leave, leader role, member list.
- Alliance fields include name, tag, description, and member list.
- Member limit is 20.
- Alliance members cannot attack each other.
- Diplomacy states are Neutral, Ally, and War.
- No full chat in v0.1; possible simple alliance announcements only.
- Rankings include Total land, Military power, Economy score, and Knowledge/technology score.
- Alliance score is later.

## Locked Architecture Decisions

- Frontend: Next.js, TypeScript, Tailwind.
- Map: MapLibre GL JS.
- Backend: Next.js API routes / route handlers first.
- Database: PostgreSQL + PostGIS.
- ORM: Prisma.
- PostGIS-heavy operations use raw SQL / TypedSQL.
- Worker: separate tick worker process every 10 minutes.
- Realtime: polling/refresh first; WebSockets later.
- Auth: email/password and Google login.
- Admin: simple admin panel in v0.1.

## Tooling Conventions

- npm is the current package manager.
- Root scripts delegate to app-local scripts in `apps/web`.
- Web dependencies and lockfile live in `apps/web`.
- Database dependencies and lockfile live in `packages/db`.
- Commit environment templates only. Real secrets belong in ignored local files such as `apps/web/.env.local`.
- Public browser-safe web environment variables must use `NEXT_PUBLIC_`; server secrets must stay server-side.
- Prisma foundation now includes v0.1 models for users, kingdoms, districts, resource stockpiles, buildings, unit stacks, land purchase cooldowns, reports, and tick logs.
- PostGIS is enabled by the first database migration.
- The initial `User` model stores email/password and Google auth fields directly; a separate auth account-linking model is deferred unless v0.1 needs it.
- The initial `AreaType` enum starts with `STANDARD` only; additional area categories can be added when v0.1 land pricing requires them, while area-type bonuses remain post-v0.1.
- Email/password auth uses first-party Next.js route handlers, Node `crypto.scrypt` password hashes, and signed `mamalik_session` cookies.
- Google login uses first-party Next.js route handlers, a short-lived HttpOnly OAuth state cookie, Google OAuth token/userinfo endpoints, and the same signed `mamalik_session` cookie as email/password auth.
- Google login links an existing email account when the Google email matches and `googleSubject` is empty; otherwise it signs in by `googleSubject` or creates a new `GOOGLE` user.
- Public Google OAuth compliance pages live at `/privacy` and `/terms`; Google Cloud OAuth consent/app branding should use `${NEXT_PUBLIC_APP_URL}/privacy` and `${NEXT_PUBLIC_APP_URL}/terms` for production publication.
- Protected app routes use server-side page guards backed by `getCurrentUser`; `/dashboard`, `/create-kingdom`, and `/admin` do not use client-only protection.
- Admin access checks `User.role === "ADMIN"` first and also supports the server-side `ADMIN_EMAILS` allowlist.
- The `/create-kingdom` map-selection UI uses MapLibre GL JS in a Client Component and requires `NEXT_PUBLIC_MAP_STYLE_URL`; missing map style configuration shows an explicit page error instead of silently changing providers.
- `POST /api/kingdom/validate-location` is a temporary Sprint 1 validation stub that checks authentication, one-kingdom-per-user, coordinate bounds, and simple distance from existing kingdoms before returning a temporary preview polygon.
- Sprint 1 temporary proximity uses a simple TypeScript distance helper and `Kingdom.centerLat` / `Kingdom.centerLng`; Sprint 4 replaces this with dynamic buffer/PostGIS validation.
- Starter kingdom constants for land, resources, population, districts, starter building footprints, starter units, land purchase packages, and beginner protection live in `packages/game/src/constants.ts` so UI and server creation logic use the same locked values.
- The locked 10-minute tick duration also lives in `packages/game/src/constants.ts` for reuse by worker logic.
- Initial Sprint 2 resource generation formulas live in `packages/game/src/economy/resource-generation.ts`; active buildings generate resources, constructing/upgrading buildings do not, and the formula returns named breakdowns for population tax and population-driven Manpower growth while preserving flat totals for worker updates.
- Initial Sprint 2 Food consumption formulas live in `packages/game/src/economy/food-consumption.ts`; population and army consume Food every processed non-duplicate tick, Food clamps at zero, and starvation penalties are deferred.
- Initial Sprint 2 construction progress rules live in `packages/game/src/buildings/construction-progress.ts`; the worker decrements `CONSTRUCTING` and `UPGRADING` building timers once per processed non-duplicate tick, sets completed buildings to `ACTIVE`, and treats an `UPGRADING` row as already carrying its target level until a richer queue model exists.
- Initial Sprint 2 training progress rules live in `packages/game/src/units/training-progress.ts`; the worker decrements active `TrainingQueueItem` rows once per processed non-duplicate tick, completes ready queues, adds completed units to the kingdom's garrison, and writes `TRAINING` reports.
- Initial Sprint 2 tick-duration display helpers live in `packages/game/src/time/tick-duration.ts` and reuse the locked 10-minute tick duration.
- `POST /api/kingdom/create` creates the user's first kingdom in a database transaction and re-runs temporary server-side location validation; it does not trust client-submitted starter state.
- Sprint 1 starter building footprints are simple 1,000 m2 constants per starter building until later balancing changes them deliberately.
- Initial land purchase cooldown records are created with `availableAt = now`; package cooldown durations apply after future purchases.
- `/dashboard` is a read-only server-rendered kingdom overview that uses the existing server-side route guard and loads kingdom state from the database.
- Dashboard calculations such as free land, beginner-protection remaining time, per-tick economy estimates, Food status, active queue display, latest tick rows, and report summaries live in `apps/web/src/lib/kingdom/dashboard-data.ts`, not in client-side UI.
- Dashboard per-tick estimates reuse `packages/game` formulas and helpers; UI components do not duplicate economy or Food-consumption formulas.
- `/admin` began as a read-only server-rendered Sprint 1 inspection panel protected by the existing server-side admin guard; it uses explicit limited database selects and still does not expose edit/reset/delete controls.
- Sprint 2 adds an admin-only Server Action from `/admin` that re-checks admin authorization and calls the existing `runOneTick` worker core for one manual tick. It does not expose a public tick API or automatic scheduler.
- `/admin` reads recent TickLog rows for inspection, including failed historical rows.
- Sprint 2 closes with manual/admin tick execution only. Automatic recurring scheduling, player-facing start-construction/start-upgrade actions, and player-facing start-training actions remain deferred v0.1 follow-ups.
- Failed TickLog rows are kept as audit/debug records and shown in admin; cleanup tooling is deferred.
- Initial Sprint 3 land package, pricing, cooldown, and validation helpers live under `packages/game/src/land`.
- The initial v0.1 land price formula is `ceil(packageSizeM2 * 2 * kingdomSizeMultiplier * areaMultiplier)`, with unknown area types defaulting to `STANDARD` until real area classification exists.
- Existing `LandPurchaseCooldown` persistence is reused for Sprint 3; no duplicate cooldown model is added.
- Sprint 3 land purchases use a Next.js Server Action backed by `apps/web/src/lib/kingdom/land-purchase.ts`. The action accepts only a package key, then reloads kingdom, stockpile, and cooldown state server-side before recalculating price/cooldown and mutating Money, usable land, cooldown rows, and `LAND_PURCHASE` reports in a transaction.
- The dashboard land purchase UI uses server-computed options from `apps/web/src/lib/kingdom/land-purchase-options.ts`; the client panel submits only package keys to the Server Action and never submits prices, cooldowns, resource values, land values, or area type.
- Land purchases currently increase gameplay usable land credit only. Real visible-border expansion and polygon recalculation are deferred future v0.1 map-hardening work because gameplay usable land credit and visible border area are intentionally separate.
- The dashboard district land view uses `District.usedLandM2` as the canonical source for district used/free land and uses `BuildingInstance` rows only for per-district building counts and building detail display.
- Sprint 3 district allocation is allocation-only: a player can add unallocated usable land into an existing district through a Server Action, but cannot take allocated land out of a district or move land between districts yet.
- District allocation creates `DISTRICT_ALLOCATION` reports. Migration `000005_district_allocation_report_type` adds the report enum value.
- Sprint 3 closes with reports as the v0.1 land purchase and district allocation history surface. A dedicated `LandPurchase` table remains deferred until reporting/query needs require it.
- Sprint 3 closes with transaction-local rechecks and conditional updates as the v0.1 land mutation concurrency baseline. Stronger row-level locking remains deferred unless production contention appears.
- Sprint 4 spatial validation stores visible borders as GeoJSON in `Kingdom.visibleBorderGeojson` for now and uses parameterized PostGIS raw SQL to generate buffer previews, measure visible area, and test overlap against stored GeoJSON. No duplicate geometry column is added in S4-001.
- Sprint 4 S4-001 uses a geodesic circular buffer with radius `sqrt(area / pi)` as the first v0.1 visible-border foundation. The generated visible area is classified as `STRICT`, `LOOSE`, or `FALLBACK` against the locked tolerance bands while gameplay usable land remains exact.
- Sprint 4 S4-004 verifies direct visible-border overlap as complete for the v0.1 foundation. It uses `ST_Intersects` between the generated preview polygon and stored `Kingdom.visibleBorderGeojson`, and returns `too-close-to-existing-kingdom` for direct overlap. Dynamic buffer distance checks beyond direct overlap remain S4-005.
- Sprint 4 S4-005 adds a v0.1 dynamic spacing rule: `minimumDistanceM = max(300, ceil(previewRadiusM * 2 + 50))`, which is 303 meters for the starting 50,000 m2 preview. The check uses PostGIS `ST_DWithin` against existing kingdom centers after direct overlap checks.
- Sprint 4 S4-005 adds nearby valid suggestions for water, restricted-zone, overlap, and dynamic-spacing failures. Suggestions are generated server-side from fixed rings and 45-degree bearings, validated through the same location pipeline with recursive suggestions disabled, and never auto-applied by kingdom creation.
- Sprint 4 S4-006 classifies valid starts server-side as `STANDARD` with source `V0_1_DEFAULT` and low confidence. Kingdom creation stores this server-side value in `Kingdom.areaType`, while non-standard classification, area-type-based buffer variation, and area-type bonuses remain deferred.
- Sprint 4 S4-007 makes visible-border generation use bounded dynamic radius attempts: initial `sqrt(area / pi)`, a corrected radius from measured area, then deterministic adjustment factors around the initial radius. The selected preview prefers `STRICT`, then `LOOSE`, then `FALLBACK` closest to 50,000 m2. The chosen measured `visibleAreaM2` remains separate from exact gameplay `usableLandM2`.
- Sprint 4 S4-009 makes the create-kingdom UI render only validated server-generated preview polygons, clear stale polygons when selection/validation state changes, expose clear validation statuses and user-facing reason text, and rerun validation when a nearby suggestion is selected.
- Sprint 4 S4-010 makes the authenticated kingdom UI use an overview-plus-detail structure: `/dashboard` is the command overview, while `/world`, `/economy`, `/land`, `/buildings`, `/army`, and `/reports` own full detail for those systems.
- Dashboard and world map previews render stored `Kingdom.visibleBorderGeojson` through a read-only MapLibre component. These previews are display-only; validation and creation still trust only server-side geometry.
- Sprint 4 closure accepts circular PostGIS preview polygons, the coarse land mask, and artificial restricted-zone fixtures as the v0.1 foundation. Production hardening must replace map datasets with reviewed, licensed imports before public launch precision claims.
- Sprint 4 S4-002 adds a raw SQL `LandMaskPolygon` PostGIS table with `geometry(MultiPolygon, 4326)`, a GiST spatial index, and a coarse `MAMALIK_COARSE_V0_1` seed loaded by `npm run db:seed-land-mask`.
- The first land mask rejects obvious open-ocean starts but is not coastline-accurate. Production should import Natural Earth 1:50m/1:110m or an equivalent licensed global land mask from local files; validation endpoints must not fetch remote map data at runtime.
- Missing land-mask data blocks kingdom validation and creation by default. `ALLOW_MISSING_LAND_MASK=true` is a local-development-only fallback.
- Sprint 4 S4-003 adds a raw SQL `RestrictedZone` PostGIS table with `geometry(MultiPolygon, 4326)`, a GiST spatial index, and artificial `MAMALIK_RESTRICTED_V0_1` no-start fixtures loaded by `npm run db:seed-restricted-zones`.
- Restricted-zone validation rejects a start if the selected point is inside an enabled zone or the generated preview polygon intersects one. Missing restricted-zone table data blocks kingdom validation and creation, while an existing table with zero active rows is treated as clear.
- The current restricted-zone seed is placeholder-only and not a production global dataset. Future sensitive datasets should keep user-facing rejection messages generic.
- Turbopack is configured with the repository root so `apps/web` can consume `packages/db` source during builds.
- Next.js `outputFileTracingRoot` is configured to the repository root so production builds can trace runtime files from repo-local packages such as `packages/db`.
- The current v0.1 logo mark is a text-free raster asset at `apps/web/public/brand/mamalik-logo.png`; render `Mamalik / ممالك` as real UI text.
- Public marketing pages use the shared `MarketingChrome` shell and the local hero asset `apps/web/public/brand/mamalik-hero-world.png`. Public copy must distinguish completed v0.1 systems from roadmap systems.
- Existing Sprint 1 web surfaces use shared Mamalik UI primitives in `apps/web/src/app/globals.css` for page backgrounds, cards, form inputs, action buttons, and data tables; keep future Sprint 1/Sprint 2 UI work aligned with those primitives unless a dedicated design-system task replaces them.
- Canonical v0.1 documentation sources are listed in `AGENTS.md`; duplicate historical docs and task artifacts live under `docs/archive/` and `tasks/archive/` as read-only references.
- Active Sprint 1-6 task tracking uses `tasks/backlog.md` and `tasks/sprint_01.md` through `tasks/sprint_06.md`; JSON/CSV exports are reference artifacts only.
- The Sprint 2 tick worker lives in `workers/tick-worker`; root scripts `tick:once`, `tick:dev`, `tick:test`, and `tick:typecheck` invoke it through existing app-local TypeScript tooling.
- Tick worker processing uses a 30-second Prisma interactive transaction timeout so remote database latency does not fail otherwise valid multi-step ticks.
- Shared game logic can be checked with root scripts `game:test` and `game:typecheck`; root `test` and `typecheck` include these checks.

## Glossary

- Kingdom: A player's main realm on the world map.
- Usable land credit: Exact gameplay land amount used for balance and capacity.
- Visible border: Virtual polygon shown on the map; may approximate the land credit.
- District: Land allocation category that contains buildings.
- Tick: A 10-minute world update cycle.
- Beginner protection: First 3 days after kingdom creation when player combat/scouting is blocked.
- Report: Stored player-facing outcome record for land, construction, scouting, battle, or training events.
- Alliance: Simple player group with leader and member list.
