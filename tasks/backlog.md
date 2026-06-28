# Mamalik v0.1 Backlog

Canonical Markdown backlog for active v0.1 work.

## Sprint 1 - Foundation + Kingdom Creation

- [x] S1-001: Initialize repository foundation and persistent memory files.
- [x] S1-002: Initialize minimal monorepo structure.
- [x] S1-003: Configure Next.js, TypeScript, Tailwind, lint, and basic scripts.
- [x] S1-004: Configure environment file examples.
- [x] S1-005: Configure Prisma and PostgreSQL/PostGIS foundation.
- [x] S1-006: Create initial v0.1 Prisma models.
- [x] S1-007: Implement email/password auth.
- [x] S1-008: Implement Google login.
- [x] S1-009: Add protected route behavior for no-kingdom users.
- [x] S1-010: Create MapLibre kingdom creation page.
- [x] S1-011: Add click marker and coordinate selection.
- [x] S1-012: Create temporary validate-location API.
- [x] S1-013: Create editable kingdom name confirmation UI.
- [x] S1-014: Create kingdom creation API.
- [x] S1-015: Seed starter districts, resources, buildings, and units.
- [x] S1-016: Create basic kingdom dashboard.
- [x] S1-017: Create basic admin views.

## Sprint 1 Maintenance

- [x] 2026-06-08: Archive duplicate legacy docs/tasks and lock canonical documentation sources.
- [x] 2026-06-17: Complete Sprint 1 QA, stabilization, and closure review.
- [x] 2026-06-17: Complete post-closure UI stabilization for existing Sprint 1 web surfaces.
- [x] 2026-06-19: Add public Privacy Policy and Terms pages for Google OAuth publication.
- [x] 2026-06-19: Complete Sprint 1 QA, auth compliance verification, and closure.

## Sprint 2 - Tick Engine + Economy

- [x] S2-001: Create tick worker skeleton.
- [x] S2-002: Add TickLog model and duplicate tick protection.
- [x] S2-003: Implement resource generation formulas.
- [x] S2-004: Implement Food consumption for population and army.
- [x] S2-005: Implement population effects on taxes and manpower.
- [x] S2-006: Implement construction queue progress.
- [x] S2-007: Implement training queue progress.
- [x] S2-008: Add dashboard economy/tick display.
- [x] S2-009: Add admin test tick action.

## Sprint 2 Maintenance

- [x] 2026-06-21: Complete Sprint 2 QA, stabilization, and closure review.

## Sprint 3 - Land Buying + District Management

- [x] S3-001: Define land package constants.
- [x] S3-002: Implement hybrid land price formula.
- [x] S3-003: Add land package cooldown persistence and validation.
- [x] S3-004: Add land purchase API.
- [x] S3-005: Add land purchase report.
- [x] S3-006: Add land package dashboard UI.
- [x] S3-007: Add district allocated/used/free land view.
- [x] S3-008: Add unused land reassignment flow.

## Sprint 3 Maintenance

- [x] 2026-06-24: Complete Sprint 3 QA, stabilization, and closure review.

## Sprint 4 - Map Validation + Borders

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

## Sprint 4 Maintenance

- [x] 2026-06-27: Complete Sprint 4 QA, stabilization, and closure review.
- [ ] Future v0.1 map hardening: Expand/recalculate visible borders after land purchases.
- [ ] Future v0.1 map hardening: Add non-`STANDARD` area classification before enabling area-type buffer variation.
- [ ] Future v0.1 map hardening: Import production-grade land-mask and restricted-zone datasets.

## Public UI / Marketing Maintenance

- [x] 2026-06-28: Refresh public landing page and add required public marketing pages.
- [x] 2026-06-29: Tighten public landing page proportions and icon treatment against the supplied reference.

## Sprint 5 - Movement + Scouting + Combat

- [ ] See `tasks/sprint_05.md`.

## Sprint 6 - Alliances + Reports + Rankings + Admin Polish

- [ ] See `tasks/sprint_06.md`.
