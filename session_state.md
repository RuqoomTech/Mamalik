# Session State

## Current Session

- Current date/time: 2026-06-23 00:39:29 +03:00
- Current sprint: Sprint 3 - Land Buying + District Management
- Current sprint file: `docs/sprints/SPRINT_03_LAND_DISTRICTS.md`
- Current task: S3-004 - Implement land purchase server action/API

## Last Completed Task

- Completed S3-004 land purchase server action/API.
- Completed S3-005 land purchase report because the S3-004 transaction creates the `LAND_PURCHASE` report.
- Added an authenticated dashboard Server Action that accepts only a land package key.
- Added a transaction-safe land purchase helper that reloads kingdom, stockpile, and cooldown state server-side; recalculates package size, price, area type, and cooldown server-side; subtracts Money; increments usable land; updates cooldown; and creates a report.
- Added a read-only land purchase options helper for the future dashboard UI.
- Did not implement full land purchase UI, district reassignment, real visible-border expansion, real map polygon recalculation, v0.2 area classification, combat, scouting, alliances, rankings, or scheduler work.

## Files Changed Recently

Changed for Sprint 3 S3-004/S3-005:

- `CHANGELOG.md`
- `context.md`
- `docs/03_TECH_ARCHITECTURE.md`
- `docs/04_DATA_MODEL.md`
- `docs/DECISIONS_LOG.md`
- `docs/TESTING_STRATEGY.md`
- `docs/sprints/SPRINT_03_LAND_DISTRICTS.md`
- `apps/web/src/app/dashboard/actions.ts`
- `apps/web/src/lib/kingdom/land-purchase-options.ts`
- `apps/web/src/lib/kingdom/land-purchase.test.ts`
- `apps/web/src/lib/kingdom/land-purchase.ts`
- `session_state.md`
- `tasks/backlog.md`
- `tasks/sprint_03.md`

## Commands Run

- `Select-String -Path C:\Users\user\.codex\memories\MEMORY.md -Pattern "Mamalik" -Context 0,4`
- `Get-Content AGENTS.md`
- `Get-Content context.md`
- `Get-Content session_state.md`
- `Get-Content docs/01_LOCKED_DECISIONS.md`
- `Get-Content docs/02_V0_1_SCOPE.md`
- `Get-Content docs/03_TECH_ARCHITECTURE.md`
- `Get-Content docs/04_DATA_MODEL.md`
- `Get-Content docs/sprints/SPRINT_03_LAND_DISTRICTS.md`
- `Get-Content tasks/sprint_03.md`
- `Get-Content tasks/backlog.md`
- `Get-Content CHANGELOG.md`
- `rg -n --glob '!apps/web/.next/**' "purchase|LandPurchase|LAND_PURCHASE|Server Action|actions.ts" apps packages docs tasks`
- `Get-Content apps/web/src/app/admin/actions.ts`
- `Get-Content apps/web/src/lib/auth/current-user.ts`
- `Get-Content apps/web/src/lib/db/client.ts`
- `Get-Content packages/game/src/land/land-packages.ts`
- `Get-Content packages/game/src/land/land-pricing.ts`
- `Get-Content packages/game/src/land/land-cooldowns.ts`
- `Get-Content packages/game/src/land/land-purchase-validation.ts`
- `Get-Content packages/db/prisma/schema.prisma`
- `npm run typecheck`
- `npm run test`
- `npm exec -- tsx src/lib/kingdom/land-purchase-smoke.tmp.ts` first failed in the sandbox with `spawn EPERM`, then ran outside the sandbox after temporary harness fixes.
- `npm run lint`
- `npm run db:typecheck`
- `npm run game:typecheck`
- `npm run tick:typecheck`
- `npm run db:validate`
- `npm run build`
- `npm run game:test`
- `npm run tick:test`
- `git diff --check`
- `git status --short`

## Test Status

- `npm run test`: passed outside the sandbox; 63 web tests, 48 game tests, and 8 worker tests passed.
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm run build`: passed outside the sandbox. It still emits the existing Node v26.1.0 deprecation warning for `module.register()`.
- `npm run db:validate`: passed outside the sandbox.
- `npm run db:typecheck`: passed.
- `npm run game:test`: passed outside the sandbox; 48 tests passed.
- `npm run game:typecheck`: passed.
- `npm run tick:test`: passed outside the sandbox; 8 tests passed.
- `npm run tick:typecheck`: passed.
- `git diff --check`: passed; Git reported CRLF normalization warnings only.

## Manual Smoke Status

- Live rollback-only DB smoke was completed with a temporary script that was removed before final checks.
- `LAND_500` purchase returned success, charged 1,000 Money, increased usable land from 50,000 to 50,500, and did not return a blocking cooldown.
- `LAND_1000` purchase returned success, charged 2,000 Money, increased usable land to 51,500, and set cooldown to `2026-06-23T18:00:00.000Z`.
- Immediate second `LAND_1000` purchase returned `COOLDOWN_ACTIVE`.
- Transaction state before rollback showed Money 22,000, usable land 51,500, and 2 land purchase reports, matching expected behavior.
- The smoke transaction deliberately rolled back and did not persist test data.

## Known Issues

- Full player-facing land purchase dashboard UI is not implemented yet.
- District allocated/used/free land view and unused-land reassignment are not implemented yet.
- Real map-driven area classification is not implemented; current pricing defaults unknown/current persisted area values to `STANDARD`.
- Land purchases currently increase gameplay usable land credit only; real visible-border expansion and polygon recalculation remain Sprint 4 work.
- Row-level locking is not implemented for land purchases; v0.1 uses transaction-local rechecks plus conditional Money/cooldown updates and can be hardened later if production contention requires it.
- Sprint 1 location validation remains temporary and intentionally does not perform real water, restricted-zone, dynamic-buffer, or PostGIS polygon validation.
- Tick worker currently runs only by manual `tick:once` or admin-triggered one-tick action; automatic scheduler behavior remains deferred.
- `npm run build` passes but emits a Node v26.1.0 deprecation warning for `module.register()`.
- Tick processing can emit a `pg` deprecation warning about `client.query()` during live DB ticks; S3-004 did not touch tick behavior.
- MapLibre dependency installation previously reported npm audit findings; no audit remediation was included.
- Production Google OAuth publication still requires external Google Cloud Console OAuth consent/app branding configuration with the production domain, callback URI, support email, logo, `/privacy`, and `/terms`.

## Open Questions

- None for S3-004/S3-005.

## Next Recommended Task

- S3-006: Add the land package dashboard UI that uses the read-only purchase options helper and calls the existing purchase Server Action.
