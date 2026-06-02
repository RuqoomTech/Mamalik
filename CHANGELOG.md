# Changelog

All notable Mamalik project changes are recorded here.

## 2026-06-02

### Added

- Added persistent Codex instructions in `AGENTS.md`.
- Added long-term project memory in `context.md`.
- Added live working memory in `session_state.md`.
- Added canonical v0.1 documentation files for locked decisions, scope, architecture, data model, sprint plan, definition of done, testing strategy, and decisions log.
- Added canonical Sprint 1-6 Markdown files under `docs/sprints/`.
- Added canonical task Markdown files under `tasks/`.
- Added the minimal Sprint 1 monorepo directory skeleton: `apps/web`, `packages/db`, `packages/game`, `packages/config`, and `workers/tick-worker`.
- Added the Next.js 16 web app foundation in `apps/web` with TypeScript, Tailwind, ESLint, App Router, npm, and `src/`.
- Added root npm forwarding scripts for `dev`, `build`, `lint`, and `typecheck`.

### Changed

- Clarified that Sprint 1 is the active sprint and v0.1 is the active release.
- Clarified that existing v0.2 material is future-only until v0.1 is complete.
- Marked Sprint 1 Task S1-002 complete in the active task files.
- Marked Sprint 1 Task S1-003 complete in the active task files.
- Recorded npm as the current package manager convention.

### Fixed

- Filled missing required repository memory files.

### Deferred

- Environment file examples are deferred to Sprint 1 Task 4.
- Game code implementation is deferred until after the repository foundation is locked.

### Known issues

- No Prisma schema, environment examples, database setup, or automated test runner exists yet.
- Legacy unpadded sprint docs and generated JSON/CSV task files remain present as reference artifacts.
- `npm run build` currently emits a Node deprecation warning for `module.register()` under Node v26.1.0, but the build passes.
