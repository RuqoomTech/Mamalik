# Sprint 1 Review - Foundation + Kingdom Creation

Date: 2026-06-19

## Completed Scope

Sprint 1 delivered the v0.1 foundation for Mamalik:

- Repository memory, canonical docs, changelog, and task tracking.
- Minimal monorepo structure for `apps/web`, `packages/db`, `packages/game`, `packages/config`, and `workers/tick-worker`.
- Next.js, TypeScript, Tailwind, ESLint, npm scripts, and environment examples.
- Prisma/PostgreSQL/PostGIS foundation with initial v0.1 models and migrations.
- Email/password register, login, logout, password hashing, and signed `mamalik_session` cookies.
- Google OAuth route handlers, state cookie validation, account linking, and shared session creation.
- Public `/privacy` and `/terms` pages for Google OAuth publication readiness.
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
| A user can register/login | Complete | Implemented and user-tested in the Sprint 1 QA flow. |
| Google login route exists and is documented | Complete | `GET /api/auth/google` and callback route exist; OAuth docs and publication checklist are current. |
| Unauthenticated users are redirected from protected routes | Complete | Server-side guards use `getCurrentUser`; user-tested in the Sprint 1 QA flow. |
| Logged-in users without a kingdom go to `/create-kingdom` | Complete | Implemented via route guards and user-tested. |
| Logged-in users with a kingdom go to `/dashboard` | Complete | Implemented via route guards and user-tested. |
| User can open `/create-kingdom` | Complete | Implemented and user-tested. |
| User can click a map point and see selected coordinates | Complete | Implemented and user-tested. |
| User can validate a selected location | Complete | Temporary validation route and UI are implemented and user-tested. |
| Invalid coordinates are rejected | Complete | Covered by automated tests. |
| Temporary proximity validation works | Complete | Covered by automated tests. |
| Confirmation UI appears after valid location | Complete | Implemented and user-tested. |
| Kingdom name is editable and validated | Complete | Covered by automated tests and user-tested in flow. |
| User can create a kingdom | Complete | Creation route and full starter transaction are implemented and user-tested. |
| Creation seeds kingdom, districts, resources, buildings, units, cooldowns, and protection | Complete | Covered by helper tests and user-tested in flow. |
| Dashboard shows kingdom state | Complete | Implemented and user-tested. |
| Admin page is protected | Complete | Implemented and user-tested. |
| Admin can inspect users, kingdoms, resources, districts, buildings, units, and reports preview | Complete | Implemented and user-tested. |
| `/privacy` and `/terms` are public | Complete | Static routes build successfully and were checked during the compliance pass. |

## Checks Run

- `npm run test`: passed, 44 tests. The sandbox run hit Windows `spawn EPERM`, then the same check passed outside the sandbox.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed outside the sandbox and includes `/privacy` and `/terms` as static routes.
- `npm run db:validate`: passed outside the sandbox with a temporary local `DATABASE_URL`.
- `npm run db:typecheck`: passed.
- `git diff --check`: passed with line-ending warnings only.
- `git status --short`: reviewed after closure edits.

## Manual Smoke Status

User-reported Sprint 1 manual QA passed on 2026-06-19:

- `/privacy` loads while logged out.
- `/terms` loads while logged out.
- Home, login, and register link to Privacy Policy and Terms of Service.
- Google login note links to both pages.
- Email/password registration, login, and logout work.
- Google login route works in the tested environment.
- Protected route redirects work for unauthenticated, no-kingdom, kingdom-owner, admin, and non-admin states.
- `/create-kingdom` loads for authenticated users without a kingdom.
- Map click, selected coordinates, temporary validation, confirmation UI, and editable kingdom name work.
- Kingdom creation succeeds and redirects to `/dashboard`.
- Created database records include Kingdom, five Districts, ResourceStockpile, starter BuildingInstances, starter UnitStacks, LandPurchaseCooldown records, and 3-day protection timestamp.
- Second kingdom creation is rejected.
- Dashboard data matches the created kingdom state.
- Admin can inspect users, kingdoms, resources, districts, buildings, units, and reports preview.
- Non-admin admin access is denied.

## Google OAuth Public-Readiness Status

App-side Google OAuth publication readiness is complete:

- `NEXT_PUBLIC_APP_URL` is documented.
- Privacy URL is documented as `${NEXT_PUBLIC_APP_URL}/privacy`.
- Terms URL is documented as `${NEXT_PUBLIC_APP_URL}/terms`.
- Google callback URL is documented as `${NEXT_PUBLIC_APP_URL}/api/auth/google/callback`.
- Docs clearly state production Google Cloud Console setup must use the public deployed domain.
- Docs clearly state local OAuth smoke tests require configured Google credentials.
- `docs/GOOGLE_OAUTH_PUBLICATION_CHECKLIST.md` lists the remaining production console steps.

Production Google Cloud Console configuration remains an external deployment step, not a Sprint 1 code blocker.

## Known Issues

- Sprint 1 location validation is temporary and intentionally does not perform real water, restricted-zone, dynamic-buffer, or PostGIS polygon validation.
- Starter building footprints are simple 1,000 m2 constants and may need later balancing.
- Initial land purchase cooldown rows use `availableAt = now`; actual land-buying behavior remains Sprint 3.
- `npm run build` passes but emits a Node v26.1.0 deprecation warning for `module.register()`.
- MapLibre dependency installation previously reported npm audit findings; no audit remediation was included in Sprint 1.

## Deferred Items

Deferred to later v0.1 sprints:

- Sprint 2: tick worker, economy generation, food consumption, population effects, construction queue, training queue, tick logs, admin test tick.
- Sprint 3: land buying, prices, cooldown behavior, land reports, district land management.
- Sprint 4: real land validation, water rejection, restricted-zone placeholders, dynamic buffer, no-overlap checks, polygon preview, nearby valid suggestions with spatial helpers.
- Sprint 5: movement, scouting, combat, defender bonuses, siege requirement, battle reports.
- Sprint 6: alliances, notifications, report center, rankings, and admin polish.

External production setup:

- Configure Google Cloud OAuth consent/app branding with production app URL, `/privacy`, `/terms`, verified domain, support email, logo, and production callback URI before public production publication.

## Readiness For Sprint 2

Sprint 1 is ready for Sprint 2 implementation.

Do not start Sprint 2 until the user explicitly requests Sprint 2 work.
