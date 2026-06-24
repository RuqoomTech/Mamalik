# Repository Guidelines

## Project Structure & Module Organization

Mamalik / ممالك is a v0.1 browser-based, tick-based grand strategy MMO. Stay inside v0.1 until it is complete and accepted; v0.2 material is future-only.

- `apps/web/`: Next.js App Router app, pages, route handlers, UI, and app-local tests.
- `packages/db/`: Prisma schema, generated client target, migrations, and DB package checks.
- `packages/game/`: shared gameplay constants and formulas. Keep resource, land, unit, tick, and district logic here when reusable.
- `workers/tick-worker/`: manual/admin tick process and worker tests.
- `docs/`: locked scope, architecture, data model, sprint plans, testing, decisions, and environment docs.
- `tasks/`: active sprint task trackers. CSV/JSON exports are reference only.

Archived files under `docs/archive/` and `tasks/archive/` are read-only historical references.

## Required Preflight For Every Task

Before editing, read `AGENTS.md`, `context.md`, `session_state.md`, `docs/01_LOCKED_DECISIONS.md`, `docs/02_V0_1_SCOPE.md`, and the current sprint file named in `session_state.md`. If a required file is missing, create it before coding.

Canonical active sources include `context.md`, `session_state.md`, `CHANGELOG.md`, `docs/01_LOCKED_DECISIONS.md`, `docs/02_V0_1_SCOPE.md`, `docs/03_TECH_ARCHITECTURE.md`, `docs/04_DATA_MODEL.md`, `docs/05_SPRINT_PLAN.md`, `docs/DEFINITION_OF_DONE.md`, `docs/TESTING_STRATEGY.md`, `docs/DECISIONS_LOG.md`, `docs/AUTHENTICATION.md`, `docs/DATABASE.md`, `docs/ENVIRONMENT.md`, `docs/MAP_DATA_SOURCES.md`, sprint docs `docs/sprints/SPRINT_01_*` through `SPRINT_06_*`, and task files `tasks/backlog.md` plus `tasks/sprint_01.md` through `tasks/sprint_06.md`.

## Build, Test, And Development Commands

- `npm run dev`: run the web app locally.
- `npm run build`: production build for `apps/web`.
- `npm run lint`: ESLint for the web app.
- `npm run typecheck`: web and shared game TypeScript checks.
- `npm run test`: web, game, and worker tests.
- `npm run db:validate`: validate Prisma schema.
- `npm run db:typecheck`: typecheck the DB package.
- `npm run game:test` / `npm run game:typecheck`: shared game logic checks.
- `npm run tick:test` / `npm run tick:typecheck`: tick worker checks.
- `npm run tick:once`: run one real tick against the configured database.

## Coding Style & Naming Conventions

Use TypeScript strictly. Prefer clear names over clever abstractions. Keep domain logic out of UI components and reuse `packages/game` for formulas. Validate all game actions server-side; never trust client-submitted resources, land, units, prices, cooldowns, or ownership. Keep gameplay usable land credit separate from visible map geometry.

Use existing naming patterns: stable package keys like `LAND_500`, uppercase Prisma enum values, focused helpers such as `getDashboardData`, and `*.test.ts` files beside the owning logic.

## Testing Guidelines

Run checks relevant to the change and document anything skipped. For code changes, prefer `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run db:validate`, and package-specific checks. For DB or gameplay mutations, add focused tests and record manual smoke results when a live DB is used.

## Documentation Update Loop

After every completed task, update `session_state.md`, `CHANGELOG.md`, relevant `docs/` files, and relevant `tasks/` files. Update `context.md` only for permanent product, architecture, workflow, or convention changes. Temporary shortcuts must be documented as temporary.

## Commit & Pull Request Guidelines

Keep commits small and reviewable. Use concise imperative messages, for example `Implement land purchase mutation`. PRs should include scope, files changed, checks run, manual smoke notes, known issues, and the next recommended task. Do not bundle unrelated sprint work.

## Security & Configuration Tips

Commit environment templates only. Real secrets belong in ignored files such as `apps/web/.env.local`. Public variables must use `NEXT_PUBLIC_`; server secrets such as `DATABASE_URL`, `SESSION_SECRET`, OAuth credentials, and `ADMIN_EMAILS` must remain server-side.

## Anti-Drift Checklist

Before responding, verify: work stayed inside v0.1 and the current sprint; v0.2 features were deferred; relevant docs and task files were updated; checks were run or explicitly documented; and the next task is clear.
