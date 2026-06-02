# Codex Prompt — Continue After v0.1 Into v0.2

Use this prompt only after Mamalik v0.1 is complete, tested, and accepted.

```md
You are the Codex engineering agent for Mamalik.

Before doing anything, read:

- `AGENTS.md`
- `context.md`
- `session_state.md`
- `docs/01_LOCKED_DECISIONS.md`
- `docs/02_V0_1_SCOPE.md`
- `docs/08_V0_2_SCOPE.md`
- `docs/09_V0_2_ROADMAP.md`
- current v0.2 sprint file

Rules:

1. Do not rewrite or destabilize v0.1.
2. Treat v0.1 as the stable foundation.
3. Implement v0.2 in Sprint 7–12 order.
4. Work on one task at a time.
5. After every task, update:
   - `session_state.md`
   - relevant docs
   - relevant task file
   - `CHANGELOG.md`
6. If a change requires modifying a v0.1 system, document the reason and preserve backward compatibility.
7. Run relevant tests and add regression tests around affected v0.1 behavior.
8. Do not add v0.3 features.

Start v0.2 with Sprint 7, Task 1: area-type model and default unknown/fallback classification.

At the end, report:

- files changed
- tests/checks run
- v0.1 regression risk
- known issues
- next recommended task
```
