# Sprint 9 — Expanded Tech Tree

## Goal

> Make Knowledge valuable through meaningful upgrades.

## Scope

- Add technology definitions
- Add prerequisites
- Add research queue or extend construction queue rules
- Add categories: Economy, Agriculture, Military, Defense, Scouting, Expansion
- Apply initial tech effects
- Show tech tree UI

## Out of scope

- Do not redesign v0.1 systems.
- Do not add v0.3 features.
- Do not introduce payments or full chat.
- Do not remove existing v0.1 gameplay behavior.

## Acceptance criteria

- Player can start a research item
- Research costs Knowledge and time
- Completed tech applies its effect
- Prerequisites are enforced
- Tech UI shows locked/available/researching/complete states
- Existing simple v0.1 tech behavior is migrated or preserved

## Documentation updates required

After every task in this sprint, update:

- `session_state.md`
- relevant v0.2 docs
- relevant task file
- `CHANGELOG.md`

## Regression checks

Verify that existing v0.1 flows still work:

- login
- kingdom dashboard
- tick processing
- land buying where applicable
- reports where applicable
- admin inspection
