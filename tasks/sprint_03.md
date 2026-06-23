# Sprint 3 Tasks - Land Buying + District Management

## Goal

Players can buy land packages and reassign unused land between districts.

## Tasks

- [x] S3-001: Define land package constants.
- [x] S3-002: Implement hybrid land price formula.
- [x] S3-003: Add land package cooldown persistence and validation.
- [x] S3-004: Add land purchase API.
- [x] S3-005: Add land purchase report.
- [x] S3-006: Add land package dashboard UI.
- [x] S3-007: Add district allocated/used/free land view.
- [ ] S3-008: Add unused land reassignment flow.

## Acceptance Criteria

- [x] Locked package sizes and cooldowns work in shared game helpers.
- [x] Prices depend on package size, kingdom size, and area type in shared game helpers.
- [x] Land purchase changes Money and usable land correctly.
- [x] Land purchase reports are created.
- [x] Dashboard shows allocated, used, free, and unallocated district land.
- [ ] Unused land can move between districts.
- [ ] Used building land cannot be moved.

## Notes

- S3-001 through S3-003 were completed together as the land purchase foundation.
- Shared land helpers now live under `packages/game/src/land`.
- Existing `LandPurchaseCooldown` persistence from Sprint 1 is reused; no duplicate cooldown model or migration was added.
- S3-004 adds the authenticated land purchase Server Action and transaction helper.
- S3-005 is complete because the purchase transaction creates `LAND_PURCHASE` reports.
- S3-006 adds the dashboard land purchase panel using server-computed options and the existing purchase Server Action.
- S3-007 adds the read-only dashboard district land view. It uses `District.usedLandM2` for used/free land and `BuildingInstance` rows for building counts only.
- District reassignment remains pending.
