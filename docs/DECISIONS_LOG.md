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
