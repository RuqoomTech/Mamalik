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
- [x] S1-014: Create `POST /api/kingdom/create` transaction.
- [x] S1-015: Seed starter districts, resources, buildings, units, cooldown records, and beginner protection.
- [x] S1-016: Create `/dashboard` kingdom overview.
- [x] S1-017: Create `/admin` basic read-only views.

## Maintenance

- [x] 2026-06-08: Archive duplicate legacy docs/tasks and lock canonical documentation sources.
- [x] 2026-06-17: Complete Sprint 1 QA, stabilization, and closure review.
- [x] 2026-06-17: Complete post-closure UI stabilization for existing Sprint 1 web surfaces.
- [x] 2026-06-19: Add public Privacy Policy and Terms pages for Google OAuth publication.

## Acceptance Criteria

- [x] Required memory and documentation files exist.
- [x] Register/login is implemented and covered by auth helper tests.
- [ ] Live email/password register/login smoke test is completed.
- [x] Google login is implemented and covered by OAuth helper tests.
- [ ] Live Google OAuth smoke test is completed.
- [x] A user without a kingdom is routed to `/create-kingdom`.
- [x] A user with a kingdom is routed to `/dashboard`.
- [x] A user can click a map location.
- [x] Temporary validation returns valid/invalid with a polygon preview.
- [x] A user can create a kingdom.
- [x] Starter state exactly matches locked v0.1 values.
- [x] Dashboard shows land, resources, population, districts, buildings, army, and protection.
- [x] Admin can view users and kingdoms.

## Notes

- Real map validation and dynamic border generation are Sprint 4.
- Do not implement tick economy in Sprint 1.
- S1-008 implementation is complete with automated tests; live Google OAuth smoke testing requires configured credentials and a reachable database.
- S1-009 protected route behavior is complete with server-side guards and automated destination/admin tests; live route smoke testing requires a reachable database.
- S1-010 includes the first MapLibre page plus the S1-011 interaction requirements because the task instructions required pan/zoom, click marker, selected coordinates, and search placeholder in the same vertical slice.
- S1-010 does not implement server validation, visible border preview, or kingdom creation API.
- S1-012 adds only temporary validation. Real water checks, restricted-zone checks, dynamic buffer/PostGIS validation, and final border generation remain deferred to Sprint 4.
- S1-013 adds the editable post-validation confirmation UI and shared starter-state constants. It does not create a kingdom or write starter state to the database.
- S1-014/S1-015 create the kingdom and full starter state in one transaction. Live route smoke testing still requires a reachable PostgreSQL/PostGIS database and signed-in no-kingdom account.
- S1-016 creates a read-only server-rendered dashboard. Live dashboard smoke testing still requires a reachable PostgreSQL/PostGIS database and signed-in kingdom owner.
- S1-017 creates a read-only server-rendered admin panel for users, kingdoms, resources, districts, buildings, units, and reports. Live admin smoke testing still requires a reachable PostgreSQL/PostGIS database and admin account.
- Sprint 1 QA closure passed automated checks and production build after configuring Next.js output file tracing for repo-local package runtime files.
- Post-closure Chrome smoke testing verified local email/password login with the prepared test account, signed-in home navigation, dashboard rendering, admin read-only rendering, and existing-kingdom `/create-kingdom` redirect behavior.
- Remaining live Sprint 1 smoke gaps require Google OAuth credentials, a signed-in no-kingdom account, and a non-admin account.
- Public `/privacy` and `/terms` pages are available for Google OAuth publication and linked from home, login, and register.
