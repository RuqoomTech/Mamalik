# Sprint 4 - Map Validation + Borders

## Goal

Replace Sprint 1 temporary location validation with v0.1-ready real-world validation and visible border generation.

## Scope

- Valid land checks.
- Water rejection.
- Restricted-zone placeholders.
- Dynamic buffer.
- No overlap.
- Visible polygon preview.
- Nearby valid point suggestions.
- PostGIS spatial helpers.

## Required Validation

- Valid latitude/longitude.
- Land only, not water.
- Not inside a restricted zone.
- Not overlapping existing kingdoms.
- Not too close to existing kingdoms under the dynamic buffer rule.
- Able to generate a starting border.

## Visible Border Generation

Use locked tolerance:

1. Try 49,000-51,000 m2.
2. Try 45,000-55,000 m2.
3. Use fallback generated polygon if needed.

Gameplay land remains exactly 50,000 m2 usable land credit.

## Nearby Suggestions

If a clicked point is invalid, suggest nearby valid points using a simple scan around the click and return the best 3 options.

## Out Of Scope

- Perfect OSM parcel matching.
- Real property parcel ownership data.
- Advanced natural border smoothing.
- Production-grade global tile hosting.

## Acceptance Criteria

- [x] Clicking water is rejected.
- [x] Clicking too close to another kingdom is rejected.
- [ ] Dynamic buffer uses area type.
- [x] Existing kingdom overlap is rejected.
- [x] Restricted-zone placeholder check exists.
- [x] A valid starting point returns a visible polygon preview.
- [x] Visible polygon uses dynamic tolerance or fallback.
- [x] Usable land remains exactly 50,000 m2.
- [x] Invalid clicks return useful reasons.
- [x] Invalid clicks can return nearby valid suggestions.

## Task Status

- [x] S4-001: Map validation and border foundation.
- [x] S4-002: Implement water rejection.
- [x] S4-003: Add restricted-zone placeholder model and checks.
- [x] S4-004: Reconcile overlap validation and tracker state.
- [x] S4-005: Implement dynamic buffer checks and nearby valid suggestions.
- [x] S4-006: Implement area type classification placeholder.
- [x] S4-007: Implement visible polygon generation with dynamic tolerance.
- [x] S4-008: Implement nearby valid point suggestions. Completed as part of S4-005.
- [x] S4-009: Update map preview UI.

## Implementation Notes

- S4-001 moved this sprint doc to `SPRINT_04_MAP_VALIDATION_BORDERS.md` to match active task naming and avoid duplicate Sprint 4 docs.
- S4-001 adds pure border helpers in `apps/web/src/lib/map/border-generation.ts`.
- S4-001 adds PostGIS raw SQL helpers in `apps/web/src/lib/map/postgis.ts`.
- The first border preview uses a geodesic circular buffer around the selected point. The radius is approximated with `sqrt(area / pi)`, targeting 50,000 m2.
- Generated visible area is measured with PostGIS and classified as `STRICT`, `LOOSE`, or `FALLBACK` against the locked tolerance bands.
- S4-007 makes visible-border generation explicitly dynamic and bounded. The generator tries the initial radius, then a corrected radius based on the measured area, then deterministic adjustment factors `0.96`, `0.98`, `1.00`, `1.02`, and `1.04` around the initial radius.
- S4-007 selects the best generated preview by preferring `STRICT`, then `LOOSE`, then `FALLBACK`; ties within a tolerance band choose the area closest to the 50,000 m2 target.
- `/api/kingdom/validate-location` now returns `targetAreaM2` and a bounded attempt count alongside the selected preview polygon, visible area, and tolerance status. The UI maps tolerance status to player-facing labels: Excellent fit, Acceptable fit, and Approximate border.
- S4-009 adds the MapLibre preview source/layers for validated server-generated polygons. Selecting a new point, starting validation, or receiving an invalid result clears the preview so stale borders are not shown.
- S4-009 adds explicit UI states for not selected, selected but unvalidated, validating, valid, invalid, and request failed.
- S4-009 makes nearby suggestions actionable from the UI: choosing a suggestion updates the marker, pans the map, clears stale state, and reruns server validation for that coordinate. Suggestions are not applied automatically during kingdom creation.
- S4-009 keeps restricted-zone messages generic and displays validation details such as usable land, visible area, target area, tolerance label/raw status, and area type without trusting client-side values for creation.
- Existing kingdom overlap is checked by converting stored `Kingdom.visibleBorderGeojson` to geometry with PostGIS and comparing it to the generated preview polygon.
- S4-004 verifies the existing overlap foundation and marks overlap complete without rewriting the helper.
- No-overlap is based on `ST_Intersects` between the generated preview polygon and existing `Kingdom.visibleBorderGeojson` values converted with `ST_GeomFromGeoJSON`.
- Overlap rejection currently returns the stable `too-close-to-existing-kingdom` no-start reason. S4-005 still owns dynamic buffer distance checks beyond direct border intersection.
- S4-005 adds a v0.1 dynamic spacing rule: `minimumDistanceM = max(300, ceil(previewRadiusM * 2 + 50))`. For the starting 50,000 m2 preview this is 303 meters.
- S4-005 checks spacing with PostGIS `ST_DWithin` against existing kingdom centers after direct border-overlap checks. Direct overlap and spacing failures both use `too-close-to-existing-kingdom`.
- S4-005 adds server-generated nearby suggestions for water, restricted-zone, overlap, and spacing failures. Suggestions scan 300m, 600m, 1,000m, 1,500m, and 2,000m rings at 45-degree bearings, cap validation at the first 24 candidates, validate each candidate through the same pipeline with recursive suggestions disabled, and return up to 3 valid candidates.
- S4-006 adds a server-side v0.1 area type classification placeholder in `apps/web/src/lib/map/area-type-classification.ts`.
- S4-006 returns `areaType: STANDARD` with `source: V0_1_DEFAULT` and `confidence: LOW` after land, restricted-zone, overlap, and dynamic-spacing checks pass.
- Kingdom creation stores the server-side classification in the existing `Kingdom.areaType` field, which currently only supports `STANDARD`; client area type values are not accepted.
- Land purchase pricing continues to use the server-stored/default `STANDARD` area type. Non-standard area type persistence, accurate land-use datasets, and area-type-based buffer variation remain deferred until classification is promoted beyond the placeholder.
- `/api/kingdom/validate-location` now uses the PostGIS validation helper and preserves the existing response fields for the current UI.
- `POST /api/kingdom/create` reruns the same server-side validation and stores the server-generated preview polygon and measured area. It still does not trust client geometry.
- S4-002 adds a raw SQL `LandMaskPolygon` table with `geometry(MultiPolygon, 4326)` and a GiST index for coarse land/water validation.
- S4-002 adds `npm run db:seed-land-mask`, which seeds a small `MAMALIK_COARSE_V0_1` land-mask dataset from local checked-in code. Validation endpoints do not fetch remote map data at runtime.
- S4-002 rejects points outside the seeded land mask as `water` before border preview generation and kingdom creation.
- If the land-mask table or rows are missing, validation returns `land-mask-data-missing` and blocks kingdom creation unless the local-development-only `ALLOW_MISSING_LAND_MASK=true` fallback is enabled.
- The current land mask rejects obvious open ocean but is not coastline-accurate; Natural Earth or an equivalent licensed global land mask remains the intended production import path.
- S4-003 adds a raw SQL `RestrictedZone` table with `geometry(MultiPolygon, 4326)`, enabled/source/category indexes, and a GiST spatial index.
- S4-003 adds `npm run db:seed-restricted-zones`, which seeds a small artificial `MAMALIK_RESTRICTED_V0_1` no-start fixture dataset. This is a validation foundation, not a production restricted-zone dataset.
- Restricted-zone validation runs after land/water checks and preview polygon generation, then before existing kingdom overlap checks.
- Validation rejects starts when either the selected point is inside a restricted zone or the generated preview polygon intersects one.
- Missing restricted-zone table data returns `restricted-zone-data-missing`; an existing table with zero active rows returns clear.
- Land purchases still increase gameplay usable land credit only; visible-border expansion from purchases remains future Sprint 4+ work.
