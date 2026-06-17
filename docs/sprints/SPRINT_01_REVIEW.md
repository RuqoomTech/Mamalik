# Sprint 1 Review - Foundation + Kingdom Creation

Date: 2026-06-17

## Completed Scope

Sprint 1 delivered the v0.1 foundation for Mamalik:

- Repository memory, canonical docs, changelog, and task tracking.
- Minimal monorepo structure for `apps/web`, `packages/db`, `packages/game`, `packages/config`, and `workers/tick-worker`.
- Next.js, TypeScript, Tailwind, ESLint, npm scripts, and environment examples.
- Prisma/PostgreSQL/PostGIS foundation with initial v0.1 models and migrations.
- Email/password register, login, logout, password hashing, and signed `mamalik_session` cookies.
- Google OAuth route handlers, state cookie validation, account linking, and shared session creation.
- Server-side route guards for `/dashboard`, `/create-kingdom`, and `/admin`.
- MapLibre create-kingdom page with pan, zoom, click marker, selected coordinates, search placeholder, and validation request.
- Temporary Sprint 1 location validation API with coordinate validation, one-kingdom-per-user rejection, simple proximity checks, suggestions, and preview polygon.
- Editable kingdom confirmation UI with starter state summary and client-side kingdom name validation.
- Kingdom creation API that re-runs server-side validation and creates the kingdom plus starter state in one transaction.
- Read-only kingdom dashboard.
- Read-only admin inspection panel.

## Acceptance Criteria Status

| Criterion | Status | Notes |
|---|---|---|
| A user can register/login | Implementation complete; live smoke pending | Auth helpers and route code exist; live route smoke needs reachable DB. |
| Google login works or is correctly implemented and documented | Implementation complete; live smoke pending | OAuth helpers and routes exist; live smoke needs Google credentials and reachable DB. |
| Unauthenticated users are redirected from protected routes | Covered by implementation/tests; live smoke pending | Server-side guards use `getCurrentUser`; live route smoke needs DB/session setup. |
| Logged-in users without a kingdom go to `/create-kingdom` | Covered by implementation/tests; live smoke pending | Destination helper tests pass. |
| Logged-in users with a kingdom go to `/dashboard` | Covered by implementation/tests; live smoke pending | Destination helper tests pass. |
| User can open `/create-kingdom` | Implementation complete; live smoke pending | Page builds successfully. |
| User can click a map point and see selected coordinates | Implementation complete; live smoke pending | Client component implemented; browser smoke needs signed-in no-kingdom account. |
| User can validate a selected location | Implementation complete; route helper tests pass | Live route smoke needs signed-in no-kingdom account and DB. |
| Invalid coordinates are rejected | Passed automated tests | Location helper tests cover missing, non-number, and out-of-range coordinates. |
| Temporary proximity validation works | Passed automated tests | Helper tests cover nearby existing kingdom rejection. |
| Confirmation UI appears after valid location | Implementation complete; live smoke pending | Browser smoke needs signed-in no-kingdom account and DB. |
| Kingdom name is editable and validated | Passed automated tests | Kingdom name helper tests pass. |
| User can create a kingdom | Implementation complete; live smoke pending | Creation helpers pass; route smoke needs DB/session. |
| Creation seeds kingdom, districts, resources, buildings, units, cooldowns, and protection | Passed automated helper tests | Starter constants and creation helper tests pass. |
| Dashboard shows kingdom state | Implementation complete; dashboard helper tests pass | Live dashboard smoke needs signed-in kingdom owner and DB. |
| Admin page is protected | Covered by implementation/tests; live smoke pending | Admin role/allowlist helper tests pass. |
| Admin can inspect users, kingdoms, resources, districts, buildings, units, and reports preview | Implementation complete; admin helper tests pass | Live admin smoke needs admin account and DB. |

## Checks Run

- `npm run test`: passed, 44 tests.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: initially failed on Prisma runtime tracing, then passed after setting `outputFileTracingRoot` to the repository root.
- `npm run db:validate`: passed with a temporary local `DATABASE_URL`.
- `npm run db:typecheck`: passed.
- `git diff --check`: passed after closure edits.
- `git status --short`: reviewed after closure edits.

## Stabilization

- Added `outputFileTracingRoot` to `apps/web/next.config.ts` so the Next.js production build traces runtime files from repo-local packages such as `packages/db`.

## Manual Smoke Result

Manual browser smoke testing was not completed in this environment.

Blocked items:

- Register with email/password.
- Log in with email/password.
- Log out.
- Trigger live Google OAuth.
- Protected route redirects.
- Create-kingdom map click and validation flow.
- Kingdom creation and database record verification.
- Dashboard database-value verification.
- Second kingdom creation rejection.
- Non-admin `/admin` denial.
- Admin `/admin` data inspection.

Blockers:

- No reachable local PostgreSQL/PostGIS database is available.
- No configured Google OAuth credentials are available.
- No prepared signed-in player/admin accounts are available.
- Local `psql` and Docker are not installed in this environment.

## Known Issues

- Sprint 1 location validation is temporary and intentionally does not perform real water, restricted-zone, dynamic-buffer, or PostGIS polygon validation.
- Starter building footprints are simple 1,000 m2 constants and may need later balancing.
- Initial land purchase cooldown rows use `availableAt = now`; actual land-buying behavior remains Sprint 3.
- `npm run build` passes but emits a Node v26.1.0 deprecation warning for `module.register()`.
- MapLibre dependency installation previously reported npm audit findings; no audit remediation was included in Sprint 1 closure.

## Deferred Items

Deferred to later v0.1 sprints:

- Sprint 2: tick worker, economy generation, food consumption, population effects, construction queue, training queue, tick logs, admin test tick.
- Sprint 3: land buying, prices, cooldown behavior, land reports, district land management.
- Sprint 4: real land validation, water rejection, restricted-zone placeholders, dynamic buffer, no-overlap checks, polygon preview, nearby valid suggestions with spatial helpers.
- Sprint 5: movement, scouting, combat, defender bonuses, siege requirement, battle reports.
- Sprint 6: alliances, notifications, report center, rankings, and admin polish.

## Readiness For Sprint 2

Sprint 1 is ready for Sprint 2 implementation from a code, automated-check, and documentation standpoint.

Before a production-like release claim, run the blocked live smoke checklist with a reachable PostgreSQL/PostGIS database, configured Google OAuth credentials, and prepared player/admin accounts.
