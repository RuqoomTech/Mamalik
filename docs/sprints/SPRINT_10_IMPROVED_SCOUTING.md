# Sprint 10 — Improved Scouting + Intelligence

## Goal

> Make scouting a strategic layer before attacks.

## Scope

- Add scout mission quality calculation
- Add report accuracy tiers
- Add scouting tech effects
- Add failed scout chance
- Add defender notification when scouts are detected
- Improve scout report UI

## Out of scope

- Do not redesign v0.1 systems.
- Do not add v0.3 features.
- Do not introduce payments or full chat.
- Do not remove existing v0.1 gameplay behavior.

## Acceptance criteria

- Scout reports vary by scout strength and tech
- Low-quality reports stay approximate
- Higher-quality reports reveal more detail
- Failed scout reports can notify defender
- Protected kingdoms remain unscoutable by players
- Scout missions against wild areas still work

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
