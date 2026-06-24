# Sprint 4 Tasks - Map Validation + Borders

## Goal

Map validation and border generation are v0.1-ready.

## Tasks

- [x] S4-001: Add PostGIS spatial helpers.
- [x] S4-002: Implement water rejection.
- [x] S4-003: Add restricted-zone placeholder model and checks.
- [ ] S4-004: Implement overlap checks.
- [ ] S4-005: Implement dynamic buffer checks.
- [ ] S4-006: Implement area type classification placeholder.
- [ ] S4-007: Implement visible polygon generation with dynamic tolerance.
- [ ] S4-008: Implement nearby valid point suggestions.
- [ ] S4-009: Update map preview UI.

## Acceptance Criteria

- [ ] Invalid locations return useful reasons.
- [x] Water, overlap, and restricted zones are rejected.
- [ ] Valid locations return visible polygon preview.
- [ ] Usable land credit remains exact.
- [ ] Nearby suggestions return for invalid clicks where possible.

## Notes

- S4-001 adds PostGIS-backed preview polygon generation, area measurement, and overlap checks while keeping visible border storage in `Kingdom.visibleBorderGeojson`.
- S4-001 updates `/api/kingdom/validate-location` and `POST /api/kingdom/create` to rerun server-side PostGIS validation.
- S4-002 adds coarse PostGIS land-mask storage, seed/import foundation, and water rejection for obvious ocean starts.
- S4-003 adds raw SQL restricted-zone storage, artificial v0.1 no-start fixtures, and point/preview-polygon restricted-zone rejection.
- Dynamic area-type buffers and nearby suggestions remain pending follow-up Sprint 4 tasks.
