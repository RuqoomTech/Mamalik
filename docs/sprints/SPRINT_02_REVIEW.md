# Sprint 2 Review - Tick Engine + Economy

Date: 2026-06-21

## Completed Scope

- Separate `workers/tick-worker` package with manual `npm run tick:once`.
- Stable 10-minute tick key calculation.
- Persistent `TickLog` model with unique `tickKey` duplicate protection.
- Resource generation for Money, Food, Manpower, and Knowledge.
- Food consumption for population and army.
- Named population tax and population-driven Manpower breakdowns.
- Construction and upgrade timer progress for already queued buildings.
- `CONSTRUCTION` reports when construction or upgrade timers complete.
- `TrainingQueueItem` model and training timer progress.
- Completed training adds units to `GARRISON` stacks and creates `TRAINING` reports.
- Read-only dashboard economy, queue, latest tick, and report display.
- Admin-only manual "Run one tick" Server Action and recent TickLog inspection.

## Acceptance Criteria Status

- Complete: Manual tick execution works through CLI and admin action.
- Complete: Duplicate tick protection prevents double resource, construction, and training processing.
- Complete: Money, Food, Manpower, and Knowledge generation is implemented through `packages/game`.
- Complete: Food consumption is implemented and Food clamps at zero.
- Complete: Food shortage count is included in tick output.
- Complete: Population tax and population Manpower breakdowns are explicit and tested.
- Complete: Construction and upgrade timers progress once per processed non-duplicate tick.
- Complete: Completed construction becomes `ACTIVE` and creates a report.
- Complete: Training timers progress once per processed non-duplicate tick.
- Complete: Completed training updates garrison stacks and creates a report.
- Complete: Dashboard shows Sprint 2 economy, queue, tick, and report state.
- Complete: Admin can run one manual tick and inspect recent TickLogs, including failed rows.
- Deferred: Player-facing start-construction/start-upgrade actions remain future v0.1 work.
- Deferred: Player-facing start-training actions and one-active-queue enforcement remain future v0.1 work.
- Deferred: Automatic scheduler remains future operational work after the manual/admin tick path is stable.

## Checks Run

Recorded in `session_state.md` for this closure task.

## Manual Smoke Status

Recorded in `session_state.md` for this closure task.

## Google/Browser Status

Sprint 2 does not change Google OAuth. Browser smoke for dashboard/admin should be run when a browser session is available; server-side and live tick checks are the closure baseline.

## Schema And Migration Status

- `000003_tick_logs` exists and adds `TickLogStatus` and `TickLog`.
- `000004_training_queue_items` exists and adds `TrainingQueueStatus` and `TrainingQueueItem`.
- Migration deployment status is recorded in `session_state.md`.

## Closure Decisions

- Automatic scheduler: deferred. Sprint 2 closes on the stable manual tick command and admin one-tick action. A scheduler should be added only after deciding the production hosting strategy for a persistent worker.
- Player-facing construction actions: deferred. Sprint 2 implemented worker-side progress for queued construction; starting construction/upgrades needs its own API/UI, costs, slot enforcement, and validation task.
- Player-facing training actions: deferred. Sprint 2 implemented worker-side progress for queued training; starting training needs its own API/UI, costs, one-active-queue enforcement, and validation task.
- Failed TickLog cleanup: deferred. Failed rows are useful audit records and remain visible in admin. No cleanup or repair tool is added in Sprint 2 closure.
- Deprecation warnings: non-blocking. The Node `module.register()` and `pg` `client.query()` warnings do not block Sprint 2 and should be revisited during dependency/toolchain maintenance.
- Transaction timeout: retained. The tick worker uses a 30-second Prisma interactive transaction timeout because the remote database exceeded Prisma's default 5-second timeout during live tick testing.

## Known Issues

- Player-facing start-construction/start-upgrade API and UI are not implemented.
- Player-facing start-training API and UI are not implemented.
- One-active-training-queue enforcement is deferred to the future start-training API.
- Automatic recurring tick scheduler is not implemented.
- A historical failed TickLog row for `2040-01-01T00:30:00.000Z` remains visible by design.
- Upgrade rows currently carry their target level directly; no pending target-level field exists yet.
- Starvation death, shortage penalties, and training pause behavior are not implemented.
- Node and `pg` deprecation warnings remain non-blocking.

## Deferred Items

- Start construction/start upgrade API and UI.
- Start training API and UI with one-active-queue enforcement.
- Production scheduler or hosted recurring tick runner.
- Optional failed TickLog maintenance tooling if audit volume becomes noisy.
- Richer upgrade model with explicit pending target level if needed by the construction UI.
- Starvation and shortage penalty behavior.

## Readiness For Sprint 3

Sprint 2 is ready to close from the tick engine, economy, dashboard visibility, and admin manual tick standpoint. Sprint 3 can begin after committing this closure review, provided the deferred start-action items are tracked as future v0.1 follow-ups and not treated as blockers for land buying and district management.
