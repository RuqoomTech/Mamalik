# Sprint 3 Tasks - Land Buying + District Management

## Goal

Players can buy land packages and reassign unused land between districts.

## Tasks

- [x] S3-001: Define land package constants.
- [x] S3-002: Implement hybrid land price formula.
- [x] S3-003: Add land package cooldown persistence and validation.
- [ ] S3-004: Add land purchase API.
- [ ] S3-005: Add land purchase report.
- [ ] S3-006: Add land package dashboard UI.
- [ ] S3-007: Add district allocated/used/free land view.
- [ ] S3-008: Add unused land reassignment flow.

## Acceptance Criteria

- [x] Locked package sizes and cooldowns work in shared game helpers.
- [x] Prices depend on package size, kingdom size, and area type in shared game helpers.
- [ ] Land purchase changes Money and usable land correctly.
- [ ] Land purchase reports are created.
- [ ] Unused land can move between districts.
- [ ] Used building land cannot be moved.

## Notes

- S3-001 through S3-003 were completed together as the land purchase foundation.
- Shared land helpers now live under `packages/game/src/land`.
- Existing `LandPurchaseCooldown` persistence from Sprint 1 is reused; no duplicate cooldown model or migration was added.
- The player-facing land purchase API, report creation, dashboard UI, and district reassignment remain pending.
