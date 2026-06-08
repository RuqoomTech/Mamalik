# Session State

## Current Session

- Current date/time: 2026-06-08 23:43:43 +03:00
- Current sprint: Sprint 1 - Foundation + Kingdom Creation
- Current sprint file: `docs/sprints/SPRINT_01_FOUNDATION.md`
- Current task: S1-009 - Protected route behavior and no-kingdom redirects

## Last Completed Task

- Sprint 1 Task S1-009 - Protected route behavior and no-kingdom redirects implemented.
- Added server-side guards for `/dashboard`, `/create-kingdom`, `/admin`, `/login`, and `/register`.
- Added Sprint 1 placeholder pages for `/dashboard`, `/create-kingdom`, and `/admin`.
- Reused `getCurrentUser` and the existing signed `mamalik_session` cookie system.
- Added admin restriction using `User.role === "ADMIN"` first, with optional server-side `ADMIN_EMAILS` allowlist support.
- Did not implement MapLibre, kingdom creation, gameplay, or full admin read-only views.

## Files Changed Recently

Changed for S1-009:

- `apps/web/src/lib/auth/current-user.ts`
- `apps/web/src/lib/auth/route-destinations.ts`
- `apps/web/src/lib/auth/guards.ts`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/create-kingdom/page.tsx`
- `apps/web/src/app/admin/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/register/page.tsx`
- `apps/web/src/lib/auth/auth.test.ts`
- `docs/AUTHENTICATION.md`
- `docs/ENVIRONMENT.md`
- `docs/sprints/SPRINT_01_FOUNDATION.md`
- `tasks/sprint_01.md`
- `tasks/backlog.md`
- `context.md`
- `docs/DECISIONS_LOG.md`
- `CHANGELOG.md`
- `session_state.md`

Still pending from previous uncommitted tasks:

- Documentation archive moves under `docs/archive/` and `tasks/archive/`.
- S1-008 Google OAuth route/helper files.
- S1-008 documentation/task tracker updates.

## Commands Run

- `Select-String -Path C:\Users\user\.codex\memories\MEMORY.md -Pattern "Mamalik" -Context 0,4`
- `Get-Content AGENTS.md`
- `Get-Content context.md`
- `Get-Content session_state.md`
- `Get-Content docs/01_LOCKED_DECISIONS.md`
- `Get-Content docs/02_V0_1_SCOPE.md`
- `Get-Content docs/AUTHENTICATION.md`
- `Get-Content docs/ENVIRONMENT.md`
- `Get-Content docs/sprints/SPRINT_01_FOUNDATION.md`
- `Get-Content tasks/sprint_01.md`
- `rg --files apps/web/src/app apps/web/src/lib/auth apps/web/src/lib/db packages/db/prisma`
- `Get-Content apps/web/src/lib/auth/current-user.ts`
- `Get-Content apps/web/src/app/page.tsx`
- `Get-Content apps/web/src/app/layout.tsx`
- `Get-Content apps/web/src/app/api/auth/logout/route.ts`
- `Get-Content apps/web/src/app/api/auth/google/callback/route.ts`
- `Get-Content apps/web/src/app/login/page.tsx`
- `Get-Content apps/web/src/app/register/page.tsx`
- `Get-Content apps/web/src/lib/auth/session.ts`
- `Get-Content apps/web/src/lib/auth/responses.ts`
- `New-Item -ItemType Directory -Force apps/web/src/app/dashboard, apps/web/src/app/create-kingdom, apps/web/src/app/admin`
- `npm run test`
- `npm run typecheck`
- `npm run lint`
- `$env:DATABASE_URL='postgresql://mamalik:mamalik@localhost:5432/mamalik?schema=public'; npm run db:validate`
- `npm run db:typecheck`
- `git diff --check`
- `npm run build`
- `git status --short`
- `Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"`

## Test Status

- Auth unit tests: passed with `npm run test`; 21 tests passed.
- App typecheck: passed with `npm run typecheck`.
- App lint: passed with `npm run lint`.
- App production build: passed with `npm run build`.
- Prisma schema validation: passed with temporary local `DATABASE_URL` and `npm run db:validate`.
- DB package TypeScript check: passed with `npm run db:typecheck`.
- Whitespace/conflict-marker check: passed with `git diff --check`.
- Git status reviewed with `git status --short`.
- Build route table includes `/dashboard`, `/create-kingdom`, and `/admin` as dynamic server-rendered routes.
- Build warning: Node emitted `[DEP0205] DeprecationWarning: module.register() is deprecated`; build still completed successfully.
- `git diff --check` emitted Windows line-ending warnings but returned exit code 0 with no whitespace errors.

## What Could Not Be Tested

- Live protected route browser smoke tests were not run because a reachable PostgreSQL/PostGIS database is not available in this environment.
- Live admin allowlist behavior was not smoke-tested against a real signed-in browser session for the same database reason.

## Known Issues

- `/dashboard`, `/create-kingdom`, and `/admin` are placeholders until their owning Sprint 1 tasks add full functionality.
- MapLibre kingdom creation remains S1-010 and was not started.
- v0.2 docs and Sprint 7-12 task artifacts remain future-only references and must not drive v0.1 work.
- Export/reference backlog files remain in place and are not active task trackers.
- Local `psql` and Docker are not installed, so migrations and live auth route smoke tests were not run locally.
- DB package install previously reported three moderate npm audit findings.
- Web app install previously reported two moderate npm audit findings after adding `tsx`.
- `npm run build` passes but emits a Node v26.1.0 deprecation warning for `module.register()`.

## Open Questions

- None.

## Next Recommended Task

Sprint 1 Task S1-010: create the `/create-kingdom` MapLibre page without implementing validation or kingdom creation transactions yet.
