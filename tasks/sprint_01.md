# Sprint 1 Tasks - Foundation + Kingdom Creation

## Goal

A logged-in player can create a valid starting kingdom and see a basic dashboard.

## Tasks

- [x] S1-001: Initialize repository foundation and persistent memory files.
- [x] S1-002: Initialize minimal monorepo structure: `apps/web`, `packages/db`, `packages/game`, `packages/config`, `workers/tick-worker`.
- [x] S1-003: Install/configure Next.js, TypeScript, Tailwind, lint, and basic scripts.
- [x] S1-004: Configure environment file examples.
- [x] S1-005: Configure Prisma and PostgreSQL/PostGIS foundation.
- [ ] S1-006: Create initial Prisma models for User, Kingdom, District, ResourceStockpile, BuildingInstance, UnitStack, LandPurchaseCooldown, and Report.
- [ ] S1-007: Implement register/login/logout.
- [ ] S1-008: Implement Google login.
- [ ] S1-009: Add protected dashboard route behavior.
- [ ] S1-010: Create `/create-kingdom` MapLibre page.
- [ ] S1-011: Add search placeholder, pan/zoom, click marker, and selected coordinates.
- [ ] S1-012: Create `POST /api/kingdom/validate-location` with temporary validation.
- [ ] S1-013: Create editable kingdom name confirmation UI.
- [ ] S1-014: Create `POST /api/kingdom/create` transaction.
- [ ] S1-015: Seed starter districts, resources, buildings, units, cooldown records, and beginner protection.
- [ ] S1-016: Create `/dashboard` kingdom overview.
- [ ] S1-017: Create `/admin` basic read-only views.

## Acceptance Criteria

- [x] Required memory and documentation files exist.
- [ ] A user can register/login.
- [ ] Google login works.
- [ ] A user without a kingdom is routed to `/create-kingdom`.
- [ ] A user with a kingdom is routed to `/dashboard`.
- [ ] A user can click a map location.
- [ ] Temporary validation returns valid/invalid with a polygon preview.
- [ ] A user can create a kingdom.
- [ ] Starter state exactly matches locked v0.1 values.
- [ ] Dashboard shows land, resources, population, districts, buildings, army, and protection.
- [ ] Admin can view users and kingdoms.

## Notes

- Real map validation and dynamic border generation are Sprint 4.
- Do not implement tick economy in Sprint 1.
