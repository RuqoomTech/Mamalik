# Session State

## Current Session

- Current date/time: 2026-06-19 20:45:35 +03:00
- Current sprint: Sprint 1 - Foundation + Kingdom Creation
- Current sprint file: `docs/sprints/SPRINT_01_FOUNDATION.md`
- Current task: Public Privacy Policy and Terms of Service for Google OAuth compliance

## Last Completed Task

- Added public Privacy Policy and Terms of Service pages for Mamalik Google OAuth publication readiness.
- Added `/privacy` and `/terms` as public, static, unauthenticated pages.
- Linked Privacy Policy and Terms of Service from home, `/login`, and `/register`.
- Added the Google-login policy notice near Google login entry points without adding fake acceptance checkboxes.
- Added `docs/GOOGLE_OAUTH_PUBLICATION_CHECKLIST.md`.
- Updated Google OAuth docs, environment docs, Sprint 1 docs, active task trackers, changelog, decisions log, and context.
- Did not implement Sprint 2, gameplay systems, or Google OAuth logic changes.

## Files Changed Recently

Changed for Google OAuth policy-page compliance:

- `AGENTS.md`
- `CHANGELOG.md`
- `context.md`
- `session_state.md`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/login/page.tsx`
- `apps/web/src/app/register/page.tsx`
- `apps/web/src/app/privacy/page.tsx`
- `apps/web/src/app/terms/page.tsx`
- `apps/web/src/components/legal/LegalLinks.tsx`
- `apps/web/src/components/legal/LegalPageLayout.tsx`
- `docs/AUTHENTICATION.md`
- `docs/ENVIRONMENT.md`
- `docs/DECISIONS_LOG.md`
- `docs/GOOGLE_OAUTH_PUBLICATION_CHECKLIST.md`
- `docs/sprints/SPRINT_01_FOUNDATION.md`
- `tasks/backlog.md`
- `tasks/sprint_01.md`

## Commands Run

- `Select-String -Path C:\Users\user\.codex\memories\MEMORY.md -Pattern "Mamalik" -Context 0,4`
- `Get-Content AGENTS.md`
- `Get-Content context.md`
- `Get-Content session_state.md`
- `Get-Content docs/AUTHENTICATION.md`
- `Get-Content docs/ENVIRONMENT.md`
- `Get-Content docs/DECISIONS_LOG.md`
- `Get-Content docs/sprints/SPRINT_01_FOUNDATION.md`
- `Get-Content tasks/sprint_01.md`
- `Get-Content tasks/backlog.md`
- `Get-Content CHANGELOG.md -TotalCount 260`
- `Get-Content docs/01_LOCKED_DECISIONS.md`
- `Get-Content docs/02_V0_1_SCOPE.md`
- `Get-ChildItem apps/web/src/app -Recurse -Depth 2 | Select-Object FullName`
- `Get-Content apps/web/src/app/layout.tsx`
- `Get-Content apps/web/src/app/page.tsx`
- `Get-Content apps/web/src/app/login/page.tsx`
- `Get-Content apps/web/src/app/register/page.tsx`
- `Get-ChildItem apps/web/src/components -Recurse | Select-Object FullName`
- `Get-Content apps/web/src/app/globals.css`
- `npm run test`
- `npm run test` outside sandbox after sandbox `spawn EPERM`
- `npm run typecheck`
- `npm run lint`
- `npm run build`
- `npm run build` outside sandbox after sandbox `spawn EPERM`
- `$env:DATABASE_URL='postgresql://mamalik:mamalik@localhost:5432/mamalik?schema=public'; npm run db:validate`
- `$env:DATABASE_URL='postgresql://mamalik:mamalik@localhost:5432/mamalik?schema=public'; npm run db:validate` outside sandbox after restricted network failure
- `npm run db:typecheck`
- `git diff --check`
- `git status --short`
- `Invoke-WebRequest -Uri http://localhost:3000/privacy -UseBasicParsing -TimeoutSec 5`
- `Invoke-WebRequest -Uri http://localhost:3000/terms -UseBasicParsing -TimeoutSec 5`
- `Start-Job -ScriptBlock { Set-Location 'D:\Side Dev\Mamalik'; npm run dev *> (Join-Path $env:TEMP 'mamalik-dev-job.log') }`
- `Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"`

## Test Status

- First `npm run test` inside sandbox: failed with Windows `spawn EPERM` before test assertions ran.
- Final `npm run test` outside sandbox: passed; 44 tests passed.
- `npm run typecheck`: passed.
- First `npm run lint`: failed on one unescaped apostrophe in `apps/web/src/app/terms/page.tsx`.
- Final `npm run lint`: passed after rewriting that sentence.
- First `npm run build` inside sandbox: compiled, then failed with Windows `spawn EPERM` during worker spawn.
- Final `npm run build` outside sandbox: passed and shows `/privacy` and `/terms` as static routes.
- First `npm run db:validate` inside sandbox: failed because Prisma attempted to reach the schema-engine endpoint through the restricted network.
- Final `npm run db:validate` outside sandbox: passed with temporary local `DATABASE_URL`.
- `npm run db:typecheck`: passed.
- `git diff --check`: passed with line-ending warnings only.

## Manual Smoke Status

- User said no further app testing is needed.
- Before that, simple HTTP checks reached `http://localhost:3000/privacy` and `http://localhost:3000/terms` and returned `200`.
- Follow-up home/login/register link checks were skipped after the dev server became unavailable and the user said no need to test the app.
- Production deployment and Google Cloud Console configuration were not performed locally.

## Known Issues

- Google Cloud Console still needs production OAuth consent/app branding configuration:
  - Privacy Policy URL: `${NEXT_PUBLIC_APP_URL}/privacy`
  - Terms of Service URL: `${NEXT_PUBLIC_APP_URL}/terms`
  - authorized production redirect URI: `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`
  - verified authorized domain
  - correct app name, logo, and support email
- Live Google OAuth smoke testing still requires configured Google OAuth credentials and production/authorized callback settings.
- The public policy pages are practical project policies, not a lawyer-reviewed legal document.
- `POST /api/kingdom/validate-location` and `POST /api/kingdom/create` still use temporary Sprint 1 location validation.
- Real water validation, restricted-zone validation, dynamic buffer/PostGIS validation, and final visible border generation remain Sprint 4 work.
- Starter building footprints are simple 1,000 m2 constants per starter building and may need later balancing.
- Initial land purchase cooldown rows use `availableAt = now`; actual purchase cooldown behavior remains Sprint 3.
- `npm run build` passes but emits a Node v26.1.0 deprecation warning for `module.register()`.

## Open Questions

- None.

## Next Recommended Task

- Add the production `/privacy` and `/terms` URLs, support email, logo, authorized domain, and production callback URL in Google Cloud Console before publishing Google OAuth.
