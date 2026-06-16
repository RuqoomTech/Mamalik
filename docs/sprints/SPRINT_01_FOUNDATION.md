# Sprint 1 - Foundation + Kingdom Creation

## Goal

A logged-in player can open Mamalik, search/pan the map, click a test location, create a kingdom with 50,000 m2 usable land, and see a basic kingdom dashboard.

## Scope

- Repository foundation and persistent memory files.
- Minimum project setup. The monorepo directory skeleton, web app tooling, environment examples, database foundation, initial Prisma models, email/password auth, Google login, protected route behavior, the first MapLibre create-kingdom page, temporary location validation, and editable kingdom name confirmation are complete; the kingdom creation API remains next.
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
- Live Google OAuth smoke testing still requires real Google OAuth credentials and a reachable database.
- Protected dashboard/create-kingdom route behavior is implemented with server-side guards.
- `/admin` is restricted to admin users by `User.role === "ADMIN"` first, with optional `ADMIN_EMAILS` allowlist support.
- `/dashboard`, `/create-kingdom`, and `/admin` are Sprint 1 placeholders until their owning tasks add full content.

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
- The confirmation panel validates kingdom names on the client and keeps the Create kingdom action as a placeholder until S1-014.
- Real land validation, final visible border generation, and kingdom creation API remain deferred to their assigned Sprint 1 and Sprint 4 tasks.

## Documentation Status

- Canonical active documentation sources are listed in `AGENTS.md`.
- Duplicate historical v0.1 docs and task artifacts were moved into `docs/archive/` and `tasks/archive/`.
- Archived files are read-only references and must not drive active v0.1 implementation.

## Required Starter State

- Usable land credit: 50,000 m2.
- Population: 1,000.
- Money: 10,000.
- Food: 5,000.
- Manpower: 500.
- Knowledge: 0.
- Army: 100 Infantry, 25 Archers.
- Beginner protection: 3 days.

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
- [ ] A user can register/login.
- [ ] Google login works. Automated auth tests pass; live OAuth smoke test still requires credentials.
- [x] A user without a kingdom is sent to create one.
- [x] A user can click a map location.
- [x] The system validates the clicked location with the temporary validation flow.
- [x] A user can review a validated location and edit a proposed kingdom name before creation.
- [ ] The user can create a kingdom.
- [ ] The kingdom starts with correct land, districts, resources, population, buildings, and units.
- [ ] The user can see the kingdom dashboard.
- [ ] Admin can view created users and kingdoms.
