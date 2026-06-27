# Sprint 4 Review - Map Validation + Borders

Date: 2026-06-27

## Completed Scope

Sprint 4 is complete for the v0.1 map-validation and starting-border foundation.

- PostGIS-backed preview polygon generation is implemented.
- Visible polygon area is measured server-side.
- Dynamic tolerance generation is implemented with `STRICT`, `LOOSE`, and `FALLBACK` selection.
- Starting gameplay usable land remains exactly 50,000 m2 and separate from visible polygon area.
- `POST /api/kingdom/validate-location` returns preview polygon, visible area, target area, tolerance status, area type metadata, and nearby suggestions where appropriate.
- `POST /api/kingdom/create` reruns server-side validation and stores only the server-generated polygon and measured area.
- Coarse water rejection uses `LandMaskPolygon`.
- Restricted-zone rejection uses `RestrictedZone`.
- Direct visible-border overlap and dynamic center spacing are enforced with PostGIS.
- Nearby suggestions are generated server-side, capped, fully validated, and non-recursive.
- `/create-kingdom` renders server-generated preview polygons, clears stale previews, and displays validation states, reason text, suggestions, tolerance, visible area, target area, and area type.
- The authenticated kingdom UI now separates overview and focused pages, including a read-only map preview on dashboard/world pages.

## Acceptance Criteria Status

| Criterion | Status | Notes |
|---|---|---|
| Water is rejected | Complete | Coarse `MAMALIK_COARSE_V0_1` land mask rejects obvious ocean starts. |
| Restricted zones are rejected | Complete | Artificial `MAMALIK_RESTRICTED_V0_1` fixtures prove the no-start path. |
| Existing border overlap is rejected | Complete | Uses `ST_Intersects` against stored `Kingdom.visibleBorderGeojson`. |
| Dynamic center spacing works | Complete | Uses the v0.1 303m starting spacing rule and `ST_DWithin`. |
| Valid points return visible polygon previews | Complete | Server returns GeoJSON, measured visible area, target area, and tolerance. |
| Visible polygon uses dynamic tolerance | Complete | Generator tries initial, corrected, and bounded adjusted radii. |
| Usable land remains exact | Complete | Creation stores `usableLandM2 = 50000`; visible area remains separate. |
| Invalid points return useful reasons | Complete | UI maps water, restricted-zone, overlap/too-close, coordinate, and data-missing reasons. |
| Invalid points can return nearby suggestions | Complete | Suggestions are server-generated and validated with recursion disabled. |
| Dynamic buffer uses area type | Deferred | Current classifier intentionally returns only `STANDARD`; non-standard area-type buffer variation would be fake without a real classifier. |

## Checks Run

Final closure checks were run after review documentation updates:

- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run db:validate`
- `npm run db:typecheck`
- `npm run db:migrate:deploy`
- `npm run db:seed-land-mask`
- `npm run db:seed-restricted-zones`
- `npm run game:test`
- `npm run game:typecheck`
- `npm run tick:test`
- `npm run tick:typecheck`
- `git diff --check`
- `git status --short`

Detailed command results are recorded in `session_state.md`.

## Manual PostGIS Smoke Status

Helper-level PostGIS smoke was run against the configured database without creating a kingdom.

| Case | Result |
|---|---|
| Safe Riyadh coordinate `24.7136, 46.6753` | Valid, `LAND`, restricted `CLEAR`, overlap false, spacing clear, `STANDARD`, visible area 49,684 m2, `STRICT`. |
| Atlantic coordinate `0, -30` | Invalid with `water`, no preview polygon. |
| Restricted fixture `24.95, 46.9` | Invalid with `restricted-zone`, 3 validated suggestions returned. |
| First restricted suggestion | Valid, `LAND`, restricted `CLEAR`, overlap false, spacing clear, `STANDARD`, `STRICT`. |
| Existing kingdom center | Invalid with `too-close-to-existing-kingdom`, overlap count 1, 3 validated suggestions returned. |
| First overlap suggestion | Valid, `LAND`, restricted `CLEAR`, overlap false, spacing clear, `STANDARD`, `STRICT`. |

Kingdom creation invalid/valid mutation smoke was not run because it would require a no-kingdom authenticated browser/API session and a safe cleanup path. The route code was reviewed and still reruns the shared server-side validation inside the creation transaction before writing starter state.

## Browser Smoke Status

Browser smoke was completed for the authenticated kingdom dashboard/detail split in S4-010:

- `/dashboard` renders as an overview.
- `/world`, `/economy`, `/land`, `/buildings`, `/army`, and `/reports` load as focused pages.
- Stored kingdom border preview renders on dashboard/world.
- A responsive nav overflow issue was found and fixed.

Create-kingdom browser smoke was attempted during closure but blocked by the current browser automation text-entry/session constraints:

- The available account owns a kingdom and is correctly redirected away from `/create-kingdom`.
- Browser text entry for registering a disposable no-kingdom account failed because the Browser virtual clipboard is not installed.
- Same-origin and data-form workarounds were not used after the Browser plugin blocked script-navigation behavior.

The create-kingdom UI remains covered by helper tests, build/typecheck, and the PostGIS helper smoke above. A manual human browser pass with a prepared no-kingdom account is still recommended before public v0.1 launch, but it is not a blocker for starting Sprint 5.

## Schema And Migration Status

Expected migrations are present:

- `000003_tick_logs`
- `000004_training_queue_items`
- `000005_district_allocation_report_type`
- `000006_land_mask_polygons`
- `000007_restricted_zones`

`npm run db:migrate:deploy` was run. The first sandboxed attempt failed because Prisma could not fetch/use the schema engine through the restricted proxy. The rerun outside the sandbox reached Prisma but returned `P1001` against the configured Supabase pooler. The same database accepted `pg` seed connections and the PostGIS validation smoke, so the Sprint 4 spatial tables are present and operational. Re-running Prisma migration deploy from the production deployment environment remains recommended.

## Seed Status

Both Sprint 4 seed scripts are idempotent because they upsert by stable ids:

- `npm run db:seed-land-mask`: seeded 9 coarse land-mask polygons from `MAMALIK_COARSE_V0_1`.
- `npm run db:seed-restricted-zones`: seeded 2 restricted-zone fixtures from `MAMALIK_RESTRICTED_V0_1`.

## Map Dataset Status

- Land mask: coarse checked-in v0.1 rectangles. Good enough to reject obvious open ocean, not coastline-accurate.
- Restricted zones: artificial placeholder fixtures. Good enough to prove table, seed, and validation behavior, not a production global no-start dataset.
- Area type: deterministic placeholder. All valid starts classify as `STANDARD` with `V0_1_DEFAULT` source and low confidence.
- Production map data import remains a future hardening task and must use versioned local/offline datasets, not runtime web fetches from validation endpoints.

## Explicit Closure Decisions

- Visible-border expansion after land purchases is deferred. Sprint 3 land purchases intentionally change gameplay usable land credit only, and the locked model keeps gameplay land separate from visible border area. A future v0.1 map-hardening task should recalculate or expand stored visible polygons after purchases.
- Area-type buffer variation is deferred. Sprint 4 only has a low-confidence `STANDARD` classifier; applying non-standard spacing multipliers before real classification would create misleading behavior.
- Browser smoke is recommended but not blocking. Dashboard/world browser smoke passed; create-kingdom browser smoke needs a prepared no-kingdom account or manual human input because the current browser automation cannot type.
- Coarse land-mask precision is acceptable for the v0.1 foundation. Production launch hardening needs Natural Earth or equivalent licensed global land-mask import.
- Restricted-zone precision is acceptable for the v0.1 foundation. Production launch hardening needs a reviewed, licensed, sensitivity-aware restricted-zone dataset.
- Circular preview polygons are acceptable for v0.1 validation. Real cadastral/parcel shapes remain future work.
- PostGIS raw SQL/helper pattern is accepted for v0.1 spatial operations. Prisma remains the relational ORM, and raw SQL remains the spatial path for geometry columns and PostGIS predicates.
- Existing Node/pg deprecation warnings are non-blocking and should be handled as dependency/toolchain maintenance.

## Known Issues

- Visible borders are simplified circular buffer previews, not cadastral parcel shapes.
- Visible-border expansion after land purchases is not implemented.
- Non-`STANDARD` area classification and area-type buffer variation are not implemented.
- Current land mask can be wrong near coastlines and islands.
- Current restricted-zone data is artificial and not production-ready.
- Suggestion scans are capped and may return no nearby valid points for invalid choices that need a wider search.
- Prisma migration deploy could not complete from this local environment, although the tables and seeds were operational through `pg` and helper smoke.

## Deferred Items

- Future v0.1 map hardening: visible-border expansion/recalculation after land purchases.
- Future v0.1 map hardening: production land-mask import from a versioned licensed dataset.
- Future v0.1 map hardening: production restricted-zone dataset and disclosure policy.
- Future v0.1 or post-v0.1 balancing: non-`STANDARD` area types and area-type buffer/pricing behavior.
- Future post-v0.1 map fidelity: cadastral or parcel-like border generation.

## Readiness For Sprint 5

Sprint 4 is ready for Sprint 5. The v0.1 foundation now supports server-side valid-land checks, water rejection, restricted-zone rejection, no-overlap/no-start spacing, visible starting border previews, and nearby suggestions without trusting client geometry or area values.
