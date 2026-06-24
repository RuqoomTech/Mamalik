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
- [ ] Clicking too close to another kingdom is rejected.
- [ ] Dynamic buffer uses area type.
- [x] Existing kingdom overlap is rejected.
- [x] Restricted-zone placeholder check exists.
- [x] A valid starting point returns a visible polygon preview.
- [x] Visible polygon uses dynamic tolerance or fallback.
- [x] Usable land remains exactly 50,000 m2.
- [ ] Invalid clicks return useful reasons.
- [ ] Invalid clicks can return nearby valid suggestions.

## Task Status

- [x] S4-001: Map validation and border foundation.
- [x] S4-002: Implement water rejection.
- [ ] S4-003: Add restricted-zone placeholder model and checks.
- [ ] S4-004: Implement overlap checks.
- [ ] S4-005: Implement dynamic buffer checks.
- [ ] S4-006: Implement area type classification placeholder.
- [ ] S4-007: Implement visible polygon generation with dynamic tolerance.
- [ ] S4-008: Implement nearby valid point suggestions.
- [ ] S4-009: Update map preview UI.

## Implementation Notes

- S4-001 moved this sprint doc to `SPRINT_04_MAP_VALIDATION_BORDERS.md` to match active task naming and avoid duplicate Sprint 4 docs.
- S4-001 adds pure border helpers in `apps/web/src/lib/map/border-generation.ts`.
- S4-001 adds PostGIS raw SQL helpers in `apps/web/src/lib/map/postgis.ts`.
- The first border preview uses a geodesic circular buffer around the selected point. The radius is approximated with `sqrt(area / pi)`, targeting 50,000 m2.
- Generated visible area is measured with PostGIS and classified as `STRICT`, `LOOSE`, or `FALLBACK` against the locked tolerance bands.
- Existing kingdom overlap is checked by converting stored `Kingdom.visibleBorderGeojson` to geometry with PostGIS and comparing it to the generated preview polygon.
- `/api/kingdom/validate-location` now uses the PostGIS validation helper and preserves the existing response fields for the current UI.
- `POST /api/kingdom/create` reruns the same server-side validation and stores the server-generated preview polygon and measured area. It still does not trust client geometry.
- S4-002 adds a raw SQL `LandMaskPolygon` table with `geometry(MultiPolygon, 4326)` and a GiST index for coarse land/water validation.
- S4-002 adds `npm run db:seed-land-mask`, which seeds a small `MAMALIK_COARSE_V0_1` land-mask dataset from local checked-in code. Validation endpoints do not fetch remote map data at runtime.
- S4-002 rejects points outside the seeded land mask as `water` before border preview generation and kingdom creation.
- If the land-mask table or rows are missing, validation returns `land-mask-data-missing` and blocks kingdom creation unless the local-development-only `ALLOW_MISSING_LAND_MASK=true` fallback is enabled.
- The current land mask rejects obvious open ocean but is not coastline-accurate; Natural Earth or an equivalent licensed global land mask remains the intended production import path.
- Restricted-zone checks still return explicit `NOT_IMPLEMENTED` placeholders until their owning task adds real checks.
- Land purchases still increase gameplay usable land credit only; visible-border expansion from purchases remains future Sprint 4+ work.
