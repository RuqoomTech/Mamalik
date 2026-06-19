# Sprint 1 - Foundation + Kingdom Creation

## Goal

A logged-in player can open Mamalik, search/pan the map, click a test location, create a kingdom with 50,000 m2 usable land, and see a basic kingdom dashboard.

## Scope

- Repository foundation and persistent memory files.
- Minimum project setup. The monorepo directory skeleton, web app tooling, environment examples, database foundation, initial Prisma models, email/password auth, Google login, protected route behavior, the first MapLibre create-kingdom page, temporary location validation, editable kingdom name confirmation, kingdom creation API, starter state seeding, basic dashboard, and basic read-only admin view are complete.
- Email/password auth and Google login.
- Database foundation.
- Basic MapLibre map screen.
- Temporary location validation.
- Kingdom creation with locked starter state.
- Basic dashboard.
- Basic admin view.

## Database Foundation Status

- Initial Prisma models exist for users, kingdoms, districts, resource stockpiles, buildings, unit stacks, land purchase cooldowns, and reports.
- Queue, tick, movement, combat, alliance, ranking, and full report-center models remain out of scope for Sprint 1 Task 6 and are deferred to their owning sprint tasks.

## Auth Status

- Email/password register, login, and logout are implemented with first-party Next.js route handlers.
- Passwords are hashed with `crypto.scrypt`.
- Sessions use signed `mamalik_session` cookies.
- Google login is implemented with first-party route handlers and reuses the signed `mamalik_session` cookie.
- Google OAuth state is stored in a short-lived HttpOnly cookie and verified on callback.
- Google login links existing email users when `googleSubject` is empty, signs in by `googleSubject`, or creates a new `GOOGLE` user.
- Public `/privacy` and `/terms` pages exist for Google OAuth publication, and home/login/register link to both pages.
- Login and register show a Google-login policy notice without adding unenforced acceptance checkboxes.
- Live Google OAuth smoke testing still requires real Google OAuth credentials and a reachable database.
- Protected dashboard/create-kingdom route behavior is implemented with server-side guards.
- `/admin` is restricted to admin users by `User.role === "ADMIN"` first, with optional `ADMIN_EMAILS` allowlist support.
- `/dashboard` now shows a read-only kingdom overview loaded from the database.
- `/admin` shows basic read-only Sprint 1 inspection views for users, kingdoms, resources, districts, buildings, units, and reports.

## Brand Asset Status

- A v0.1 logo mark exists at `apps/web/public/brand/mamalik-logo.png`.
- The mark is text-free; `Mamalik / ممالك` is rendered as real UI text.

## Map Selection Status

- `/create-kingdom` is protected by the Sprint 1 server-side no-kingdom guard.
- The page renders a MapLibre GL JS map in a Client Component.
- The map uses `NEXT_PUBLIC_MAP_STYLE_URL` and shows a configuration error if the value is missing.
- The first map slice supports pan, zoom, map click selection, a marker, selected coordinates, a search placeholder, and a validate-location request.
- S1-011 was already completed by the S1-010 map slice.
- `POST /api/kingdom/validate-location` performs temporary Sprint 1 validation with coordinate bounds, one-kingdom-per-user rejection, simple proximity rejection, nearby suggestions, and a temporary preview polygon.
- After successful validation, `/create-kingdom` shows an editable confirmation panel with selected coordinates, validation status, usable land, visible area, preview polygon summary, starter resources, starting districts, starter buildings, starter army, and beginner protection.
- The confirmation panel validates kingdom names on the client, calls `POST /api/kingdom/create`, shows loading/errors, and redirects to `/dashboard` after success.
- `POST /api/kingdom/create` re-runs temporary validation server-side and creates the kingdom plus locked starter state in one transaction.
- `/dashboard` loads the logged-in player's kingdom plus resources, districts, buildings, and unit stacks server-side.
- `/admin` loads limited read-only foundation data server-side and remains protected by the Sprint 1 admin guard.
- Real land validation and final visible border generation remain deferred to their assigned Sprint 4 tasks.

## Documentation Status

- Canonical active documentation sources are listed in `AGENTS.md`.
- Duplicate historical v0.1 docs and task artifacts were moved into `docs/archive/` and `tasks/archive/`.
- Archived files are read-only references and must not drive active v0.1 implementation.
- A post-closure UI stabilization pass aligned the existing Sprint 1 home, auth, dashboard, admin, and create-kingdom surfaces to shared Mamalik UI primitives without adding new gameplay systems.

## Required Starter State

- Usable land credit: 50,000 m2.
- Population: 1,000.
- Money: 10,000.
- Food: 5,000.
- Manpower: 500.
- Knowledge: 0.
- Army: 100 Infantry, 25 Archers.
- Beginner protection: 3 days.
- Starter building footprints: 1,000 m2 per starter building as a simple Sprint 1 implementation constant.
- Initial land purchase package cooldown rows are created for 500, 1,000, 5,000, and 10,000 m2 packages with `availableAt = now`.

## Required Districts

| District | Allocation |
|---|---:|
| Economic | 15,000 m2 |
| Residential | 12,000 m2 |
| Military | 8,000 m2 |
| Defensive | 8,000 m2 |
| Research | 7,000 m2 |

## Temporary Location Validation

Sprint 1 validation is intentionally temporary:

- Validate lat/lng exists.
- Reject invalid coordinate ranges.
- Reject if too close to an existing kingdom using a simple distance check.
- Return a temporary polygon preview.

Real valid land, water rejection, restricted zones, OSM parcel style, and dynamic tolerance are Sprint 4.

## Out Of Scope

- Tick worker.
- Real land validation.
- Real border generation.
- Land buying.
- Combat.
- Scouting.
- Alliances.
- Rankings.
- Full report center.

## Acceptance Criteria

- [x] Required memory and documentation files exist.
- [x] Register/login is implemented and covered by auth helper tests.
- [ ] Live email/password register/login smoke test is completed.
- [x] Google login is implemented and covered by OAuth helper tests.
- [ ] Live Google OAuth smoke test is completed.
- [x] A user without a kingdom is sent to create one.
- [x] A user can click a map location.
- [x] The system validates the clicked location with the temporary validation flow.
- [x] A user can review a validated location and edit a proposed kingdom name before creation.
- [x] The user can create a kingdom through the Sprint 1 API.
- [x] The kingdom starts with correct land, districts, resources, population, buildings, units, cooldown rows, and beginner protection.
- [x] The user can see the kingdom dashboard.
- [x] Admin can view created users and kingdoms.

## Sprint 1 Closure Status

- Automated checks passed during Sprint 1 QA closure.
- Production build passed after configuring Next.js `outputFileTracingRoot` to the repository root.
- Post-closure Chrome smoke testing verified local email/password login with the prepared test account, signed-in home navigation, dashboard rendering, admin read-only rendering, and existing-kingdom `/create-kingdom` redirect behavior.
- Live Google OAuth, no-kingdom create-kingdom map/creation flow, second kingdom rejection, and non-admin admin-denial smoke tests still require prepared accounts/credentials.
- Sprint 1 is ready for Sprint 2 implementation from a code and documentation standpoint, with live smoke validation still required before any production-like release claim.
