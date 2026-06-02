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
