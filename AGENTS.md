# AGENTS.md

Persistent operating instructions for Codex agents working on Mamalik / ممالك.

## Project Rules

- Work on Mamalik v0.1 until v0.1 is complete, tested, and accepted.
- Do not change product direction unless the user explicitly approves the change.
- Do not implement v0.2 features during v0.1.
- Treat temporary shortcuts as temporary and document them in `session_state.md` and the relevant docs.
- Prefer small, reviewable changes.

## Required Reading Before Each Task

Before starting any task, read:

1. `AGENTS.md`
2. `context.md`
3. `session_state.md`
4. `docs/01_LOCKED_DECISIONS.md`
5. `docs/02_V0_1_SCOPE.md`
6. The current sprint file named in `session_state.md`

If a required file is missing, create it before coding.

## Canonical Documentation Sources

Use these files as the active source of truth for v0.1 work:

- `AGENTS.md`
- `context.md`
- `session_state.md`
- `CHANGELOG.md`
- `docs/01_LOCKED_DECISIONS.md`
- `docs/02_V0_1_SCOPE.md`
- `docs/03_TECH_ARCHITECTURE.md`
- `docs/04_DATA_MODEL.md`
- `docs/05_SPRINT_PLAN.md`
- `docs/DEFINITION_OF_DONE.md`
- `docs/TESTING_STRATEGY.md`
- `docs/DECISIONS_LOG.md`
- `docs/AUTHENTICATION.md`
- `docs/DATABASE.md`
- `docs/ENVIRONMENT.md`
- `docs/BRAND_ASSETS.md`
- `docs/GOOGLE_OAUTH_PUBLICATION_CHECKLIST.md`
- `docs/sprints/SPRINT_01_FOUNDATION.md`
- `docs/sprints/SPRINT_02_TICK_ENGINE.md`
- `docs/sprints/SPRINT_03_LAND_DISTRICTS.md`
- `docs/sprints/SPRINT_04_MAP_VALIDATION.md`
- `docs/sprints/SPRINT_05_COMBAT_SCOUTING.md`
- `docs/sprints/SPRINT_06_ALLIANCES_REPORTS_RANKINGS.md`
- `tasks/backlog.md`
- `tasks/sprint_01.md`
- `tasks/sprint_02.md`
- `tasks/sprint_03.md`
- `tasks/sprint_04.md`
- `tasks/sprint_05.md`
- `tasks/sprint_06.md`

Archived documentation and task files under `docs/archive/` and `tasks/archive/` are read-only historical references. Do not use archived files to determine active scope, active tasks, or implementation details.

v0.2 files remain future-only references until v0.1 is complete and accepted. Do not implement v0.2 work during v0.1.

Export/reference backlog files such as `tasks/full_v0_1_backlog.*` and `tasks/full_v0_2_backlog.*` are reference exports, not active task trackers.

## Documentation Update Loop

After every completed task, update:

- `context.md` when a permanent product, architecture, or workflow decision changes.
- `session_state.md` with current date/time, task completed, files changed, commands run, test status, known issues, and next recommended task.
- Relevant files under `docs/`.
- Relevant sprint/task files under `docs/sprints/` and `tasks/`.
- `CHANGELOG.md` with Added, Changed, Fixed, Deferred, and Known issues entries where applicable.

## Testing Rules

- Always run relevant checks for the work completed.
- For code changes, prefer typecheck, lint, unit tests, Prisma validation, migration validation, and manual smoke notes as applicable.
- If no automated checks exist yet, document why in `session_state.md`.
- Never claim a check passed unless it was actually run.

## Engineering Rules

- Use TypeScript strictly once application code exists.
- Keep domain logic in reusable modules where possible.
- Do not hide game calculations inside UI components.
- Use clear names over clever abstractions.
- Validate all game actions server-side.
- Never trust client-submitted resource, land, unit, or price values.
- Keep gameplay land credit separate from visible map geometry.
- Use simple v0.1-compatible implementations that can evolve.

## Anti-Drift Checklist

Before every response, verify:

- Work is inside v0.1.
- Work is inside the current sprint.
- `context.md` and `session_state.md` have been considered.
- v0.2-only features are deferred.
- Relevant docs were updated.
- Relevant checks were run or explicitly documented as unavailable.
- The next task is clear.
