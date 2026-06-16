# Sprint 1 Tasks - Foundation + Kingdom Creation

## Goal

A logged-in player can create a valid starting kingdom and see a basic dashboard.

## Tasks

- [x] S1-001: Initialize repository foundation and persistent memory files.
- [x] S1-002: Initialize minimal monorepo structure: `apps/web`, `packages/db`, `packages/game`, `packages/config`, `workers/tick-worker`.
- [x] S1-003: Install/configure Next.js, TypeScript, Tailwind, lint, and basic scripts.
- [x] S1-004: Configure environment file examples.
- [x] S1-005: Configure Prisma and PostgreSQL/PostGIS foundation.
- [x] S1-006: Create initial Prisma models for User, Kingdom, District, ResourceStockpile, BuildingInstance, UnitStack, LandPurchaseCooldown, and Report.
- [x] S1-007: Implement register/login/logout.
- [x] S1-008: Implement Google login.
- [x] S1-009: Add protected dashboard route behavior.
- [x] S1-010: Create `/create-kingdom` MapLibre page.
- [x] S1-011: Add search placeholder, pan/zoom, click marker, and selected coordinates.
- [x] S1-012: Create `POST /api/kingdom/validate-location` with temporary validation.
- [x] S1-013: Create editable kingdom name confirmation UI.
- [ ] S1-014: Create `POST /api/kingdom/create` transaction.
- [ ] S1-015: Seed starter districts, resources, buildings, units, cooldown records, and beginner protection.
- [ ] S1-016: Create `/dashboard` kingdom overview.
- [ ] S1-017: Create `/admin` basic read-only views.

## Maintenance

- [x] 2026-06-08: Archive duplicate legacy docs/tasks and lock canonical documentation sources.

## Acceptance Criteria

- [x] Required memory and documentation files exist.
- [ ] A user can register/login.
- [ ] Google login works.
- [x] A user without a kingdom is routed to `/create-kingdom`.
- [x] A user with a kingdom is routed to `/dashboard`.
- [x] A user can click a map location.
- [x] Temporary validation returns valid/invalid with a polygon preview.
- [ ] A user can create a kingdom.
- [ ] Starter state exactly matches locked v0.1 values.
- [ ] Dashboard shows land, resources, population, districts, buildings, army, and protection.
- [ ] Admin can view users and kingdoms.

## Notes

- Real map validation and dynamic border generation are Sprint 4.
- Do not implement tick economy in Sprint 1.
- S1-008 implementation is complete with automated tests; live Google OAuth smoke testing requires configured credentials and a reachable database.
- S1-009 protected route behavior is complete with server-side guards and automated destination/admin tests; live route smoke testing requires a reachable database.
- S1-010 includes the first MapLibre page plus the S1-011 interaction requirements because the task instructions required pan/zoom, click marker, selected coordinates, and search placeholder in the same vertical slice.
- S1-010 does not implement server validation, visible border preview, or kingdom creation API.
- S1-012 adds only temporary validation. Real water checks, restricted-zone checks, dynamic buffer/PostGIS validation, and final border generation remain deferred to Sprint 4.
- S1-013 adds the editable post-validation confirmation UI and shared starter-state constants. It does not create a kingdom or write starter state to the database.
