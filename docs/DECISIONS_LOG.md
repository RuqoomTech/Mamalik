# Decisions Log

## 2026-06-02 - v0.1 Documentation Foundation

- Decision: v0.1 is the active implementation scope.
- Decision: Sprint 1 is the active sprint.
- Decision: v0.2 docs and Sprint 7-12 artifacts remain future-only until v0.1 is complete.
- Decision: Zero-padded Markdown files are the canonical working docs/tasks for Sprint 1-6.
- Decision: No application code is created in Sprint 1 Task 1 because the repository is not empty and the task is documentation foundation.
- Decision: Next implementation task is minimum project setup for Next.js, TypeScript, Tailwind, Prisma, and the intended repo structure.

## 2026-06-02 - Sprint 1 Initial Prisma Models

- Decision: Sprint 1 Task 6 implements only `User`, `Kingdom`, `District`, `ResourceStockpile`, `BuildingInstance`, `UnitStack`, `LandPurchaseCooldown`, and `Report`.
- Decision: Queue, tick, movement, combat, alliance, ranking, and full report-center models remain deferred to their owning v0.1 sprint tasks.
- Decision: The initial `User` model stores email/password and Google login fields directly with `passwordHash` and `googleSubject`; a separate auth account-linking model is deferred unless v0.1 needs it.
- Decision: The initial `AreaType` enum contains only `STANDARD`. Additional area categories can be added when v0.1 land pricing needs them; area-type bonuses remain post-v0.1.

## 2026-06-07 - Sprint 1 Email Password Auth

- Decision: Sprint 1 Task 7 uses first-party Next.js route handlers for email/password register, login, and logout.
- Decision: Password hashes use Node `crypto.scrypt` with the stored format `scrypt:v1:<salt>:<hash>`.
- Decision: Sessions use signed `mamalik_session` cookies with `SESSION_SECRET` and no session table for the first v0.1 auth slice.
- Decision: Google login remains deferred to Sprint 1 Task 8, and protected route behavior remains deferred to Sprint 1 Task 9.
- Decision: Turbopack uses the repository root so `apps/web` can build against `packages/db` source.

## 2026-06-08 - Documentation Drift Cleanup

- Decision: `AGENTS.md` now lists the canonical active documentation and task files for v0.1 Sprint 1-6.
- Decision: Zero-padded Sprint 1-6 docs under `docs/sprints/` remain canonical for active v0.1 sprint planning.
- Decision: `tasks/backlog.md` and `tasks/sprint_01.md` through `tasks/sprint_06.md` remain canonical for active task tracking.
- Decision: Duplicate historical v0.1 docs and task artifacts were moved into `docs/archive/` and `tasks/archive/` and are read-only historical references.
- Decision: v0.2 docs and v0.2 task artifacts remain in place as future-only references and must not drive v0.1 implementation.

## 2026-06-08 - Sprint 1 Google Login

- Decision: Sprint 1 Task 8 uses first-party Next.js route handlers for Google OAuth instead of adding a larger auth framework.
- Decision: Google OAuth state is stored in a short-lived HttpOnly cookie scoped to `/api/auth/google` and verified during callback.
- Decision: Successful Google login reuses the existing signed `mamalik_session` cookie and session payload format.
- Decision: Existing email/password users are linked to Google only when the verified Google email matches and `googleSubject` is empty.
- Decision: Protected route behavior remains deferred to Sprint 1 Task 9.

## 2026-06-08 - Sprint 1 Protected Routes

- Decision: Sprint 1 Task 9 protects `/dashboard`, `/create-kingdom`, and `/admin` with server-side page guards instead of client-only checks.
- Decision: Route guards reuse `getCurrentUser` and the existing signed `mamalik_session` cookie.
- Decision: `/dashboard` requires a signed-in user with a kingdom; signed-in users without a kingdom are redirected to `/create-kingdom`.
- Decision: `/create-kingdom` requires a signed-in user without a kingdom; signed-in users with a kingdom are redirected to `/dashboard`.
- Decision: `/admin` checks `User.role === "ADMIN"` first and supports `ADMIN_EMAILS` as a server-side v0.1 allowlist.
- Decision: Map UI, kingdom creation, and admin read-only views remain deferred to their assigned Sprint 1 tasks.

## 2026-06-16 - Sprint 1 MapLibre Kingdom Location Page

- Decision: Sprint 1 Task 10 uses MapLibre GL JS for the first `/create-kingdom` map-selection page.
- Decision: Map interaction lives in `apps/web/src/components/map/KingdomLocationMap.tsx` as a Client Component while the page keeps the existing server-side no-kingdom route guard.
- Decision: The map requires `NEXT_PUBLIC_MAP_STYLE_URL`; missing configuration is shown as a clear page error instead of silently switching to another map style.
- Decision: Riyadh is the initial map center for the first v0.1 selection slice.
- Decision: Real location validation, visible border preview, and kingdom creation remain deferred to their assigned Sprint 1 and Sprint 4 tasks.

## 2026-06-17 - Sprint 1 Temporary Location Validation

- Decision: Sprint 1 Task 12 implements `POST /api/kingdom/validate-location` as a temporary validation stub, not final land validation.
- Decision: The temporary endpoint requires an authenticated user and rejects users who already own a kingdom.
- Decision: The temporary endpoint validates coordinate presence, numeric values, and world bounds before checking proximity.
- Decision: The temporary proximity check uses a simple TypeScript distance helper with a 250 meter minimum distance against existing `Kingdom.centerLat` and `Kingdom.centerLng`.
- Decision: The temporary preview polygon approximates 50,000 m2 visually while preserving gameplay land credit as exactly 50,000 m2.
- Decision: Sprint 4 replaces temporary proximity and preview behavior with dynamic buffer/PostGIS validation and real visible-border handling.

## 2026-06-17 - Sprint 1 Kingdom Confirmation UI

- Decision: Sprint 1 Task 13 adds only the post-validation confirmation UI; it does not create a kingdom or write starter state to the database.
- Decision: Locked starter-state values are centralized in `packages/game/src/constants.ts` for reuse by the confirmation UI and the future creation API.
- Decision: Kingdom name validation is client-side in S1-013 for immediate feedback, while the S1-014 server creation endpoint must validate the submitted name again.
- Decision: The Create kingdom button remains a placeholder until `POST /api/kingdom/create` is implemented in S1-014.

## 2026-06-17 - Sprint 1 Kingdom Creation Transaction

- Decision: Sprint 1 Task 14 implements `POST /api/kingdom/create` as a first-party Next.js route handler using the existing signed session system.
- Decision: The creation endpoint re-runs temporary location validation server-side and rejects users who already own a kingdom.
- Decision: The endpoint creates the kingdom, five districts, resource stockpile, starter buildings, starter units, land package cooldown rows, and beginner protection timestamp in one transaction, completing S1-014 and S1-015 together.
- Decision: Starter building footprints are simple 1,000 m2 constants per starter building until a later balancing task intentionally changes them.
- Decision: Initial land purchase cooldown rows use `availableAt = now`; cooldown durations apply after purchases are implemented in Sprint 3.
- Decision: Real water validation, restricted-zone validation, PostGIS dynamic buffers, and final visible border generation remain Sprint 4 work.

## 2026-06-17 - Sprint 1 Kingdom Dashboard

- Decision: Sprint 1 Task 16 keeps `/dashboard` as a server component protected by the existing `requireUserWithKingdom` guard.
- Decision: The dashboard is read-only and loads kingdom state directly from the database; it does not implement tick logic, building actions, land buying, combat, scouting, alliances, reports center, or rankings.
- Decision: Dashboard-derived display values such as free land, district free land, enum labels, and beginner-protection remaining time live in `apps/web/src/lib/kingdom/dashboard-data.ts`.

## 2026-06-17 - Sprint 1 Admin Read-Only Views

- Decision: Sprint 1 Task 17 keeps `/admin` as a server component protected by the existing `requireAdmin` guard.
- Decision: The admin panel is read-only and uses limited explicit database selects for users, kingdoms, resources, districts, buildings, units, and latest reports.
- Decision: No admin write, reset, delete, edit, or tick controls are introduced in Sprint 1 Task 17.
- Decision: Admin-derived display values such as enum labels, district free land, and report read/unread state live in `apps/web/src/lib/admin/admin-data.ts`.

## 2026-06-17 - Sprint 1 QA Closure

- Decision: Sprint 1 is considered ready for Sprint 2 implementation from a code, automated-check, and documentation standpoint.
- Decision: Live Sprint 1 smoke validation remains a separate operational requirement because this environment lacks reachable PostgreSQL/PostGIS, Google OAuth credentials, and prepared player/admin accounts.
- Decision: `apps/web` sets Next.js `outputFileTracingRoot` to the repository root so production builds can trace runtime files from repo-local packages such as `packages/db`.
- Decision: Sprint 2 implementation must not start until explicitly requested after this Sprint 1 closure task.

## 2026-06-17 - Sprint 1 UI Stabilization

- Decision: The post-closure UI pass improves existing Sprint 1 pages only; it does not introduce new gameplay, Sprint 2 tick logic, or new admin actions.
- Decision: Shared Mamalik UI primitives in `apps/web/src/app/globals.css` are the current lightweight UI-system convention for page shells, cards, inputs, actions, and tables.
- Decision: Home, auth, dashboard, admin, and create-kingdom surfaces should reuse those primitives for consistency until a later dedicated design-system task intentionally replaces them.

## 2026-06-19 - Google OAuth Public Policy Pages

- Decision: Mamalik exposes `/privacy` and `/terms` as public static pages for Google OAuth publication and user transparency.
- Decision: The public policy pages describe current v0.1 data practices honestly and do not add unsupported legal, payment, or ownership claims.
- Decision: Google OAuth publication should use `${NEXT_PUBLIC_APP_URL}/privacy` and `${NEXT_PUBLIC_APP_URL}/terms` in Google Cloud OAuth consent/app branding settings.
- Decision: Login and register show a policy notice near the Google login entry point without adding unenforced acceptance checkboxes.

## 2026-06-19 - Sprint 1 Auth Compliance Closure

- Decision: Sprint 1 app-side foundation and auth compliance are complete after user-reported manual QA verified public legal pages, auth flows, route guards, kingdom creation, dashboard, admin access, and second-kingdom rejection.
- Decision: Sprint 1 is ready for Sprint 2 implementation when the user explicitly starts Sprint 2.
- Decision: Production Google Cloud OAuth consent/app branding configuration remains an external deployment task and is not a Sprint 1 code blocker.

## 2026-06-19 - Sprint 2 Tick Worker Foundation

- Decision: Sprint 2 starts with a separate `workers/tick-worker` package instead of putting tick processing inside the Next.js app.
- Decision: The first supported worker command is manual `npm run tick:once`; a long-running scheduler remains deferred until the manual tick is stable.
- Decision: Tick keys are stable UTC ISO timestamps rounded down to locked 10-minute slots.
- Decision: `TickLog.tickKey` is unique and is the duplicate-processing guard for v0.1 tick execution.
- Decision: The first tick worker implementation records tick status and counts kingdoms only; resource generation, Food consumption, population effects, construction progress, and training progress remain later Sprint 2 tasks.

## 2026-06-19 - Sprint 2 Resource Generation Formulas

- Decision: Initial v0.1 resource formulas live in `packages/game/src/economy/resource-generation.ts` so worker and future UI/read models can share deterministic game logic.
- Decision: Only `ACTIVE` buildings generate resources; `CONSTRUCTING` and `UPGRADING` buildings produce nothing until their owning queue tasks complete them.
- Decision: S2-003 generates Food from Farms but does not subtract Food consumption. Consumption remains S2-004.
- Decision: Initial formulas clamp invalid population and building levels to non-negative integers instead of throwing during tick processing.
