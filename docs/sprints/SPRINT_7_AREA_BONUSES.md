# Sprint 7 — Area-Type Bonuses + Map Classification

## Goal

> Real-world area type begins to affect kingdom strategy without breaking v0.1 balance.

## Scope

- Add area profile model or fields
- Add area type enum
- Create fallback UNKNOWN classification
- Add configurable bonus table
- Apply simple modifiers to resource previews first
- Show area profile on dashboard
- Admin override for area type

## Out of scope

- Do not redesign v0.1 systems.
- Do not add v0.3 features.
- Do not introduce payments or full chat.
- Do not remove existing v0.1 gameplay behavior.

## Acceptance criteria

- Each kingdom has an area profile
- Unknown/fallback locations still work
- Area bonus values are visible to the player
- Bonuses do not modify land credit directly
- Admin can inspect or override classification
- v0.1 kingdom creation still works

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
