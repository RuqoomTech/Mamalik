# Sprint 4 Tasks - Map Validation + Borders

## Goal

Map validation and border generation are v0.1-ready.

## Tasks

- [x] S4-001: Add PostGIS spatial helpers.
- [x] S4-002: Implement water rejection.
- [x] S4-003: Add restricted-zone placeholder model and checks.
- [x] S4-004: Reconcile overlap validation and tracker state.
- [x] S4-005: Implement dynamic buffer checks and nearby valid suggestions.
- [x] S4-006: Implement area type classification placeholder.
- [x] S4-007: Implement visible polygon generation with dynamic tolerance.
- [x] S4-008: Implement nearby valid point suggestions. Completed as part of S4-005.
- [x] S4-009: Update map preview UI.
- [x] S4-010: Split kingdom dashboard into overview and focused kingdom pages.

## Acceptance Criteria

- [x] Invalid locations return useful reasons.
- [x] Water, overlap, and restricted zones are rejected.
- [x] Valid locations return visible polygon preview.
- [x] Usable land credit remains exact.
- [x] Nearby suggestions return for invalid clicks where possible.

## Notes

- S4-001 adds PostGIS-backed preview polygon generation, area measurement, and overlap checks while keeping visible border storage in `Kingdom.visibleBorderGeojson`.
- S4-001 updates `/api/kingdom/validate-location` and `POST /api/kingdom/create` to rerun server-side PostGIS validation.
- S4-002 adds coarse PostGIS land-mask storage, seed/import foundation, and water rejection for obvious ocean starts.
- S4-003 adds raw SQL restricted-zone storage, artificial v0.1 no-start fixtures, and point/preview-polygon restricted-zone rejection.
- S4-004 verifies overlap validation as already implemented: generated preview polygons are checked against existing `Kingdom.visibleBorderGeojson` geometry and return `too-close-to-existing-kingdom` on direct border intersection. Dynamic buffer spacing remains S4-005.
- S4-005 adds a 303m starting dynamic spacing rule derived from preview radius, uses PostGIS `ST_DWithin` for center-distance spacing, and returns up to 3 server-validated nearby suggestions for water, restricted-zone, overlap, and spacing failures.
- S4-006 adds a server-side area-type placeholder that classifies valid starts as `STANDARD` with `V0_1_DEFAULT` and low confidence, stores `STANDARD` during kingdom creation, and leaves non-standard buffer/pricing behavior inactive until a real classifier is introduced.
- S4-007 adds bounded dynamic visible-border generation: initial radius, corrected radius, deterministic adjustment factors, and best-result selection that prefers `STRICT`, then `LOOSE`, then `FALLBACK` closest to the 50,000 m2 target.
- S4-009 adds clear create-kingdom map preview states, validated polygon rendering, stale-preview clearing, suggestion revalidation, and confirmation-panel target/tolerance details.
- S4-010 makes `/dashboard` a command overview, adds focused `/world`, `/economy`, `/land`, `/buildings`, `/army`, and `/reports` pages, and renders stored kingdom borders through a read-only MapLibre preview.
- Area-type buffer variation and visible-border expansion after land purchases remain pending follow-up Sprint 4 tasks.
