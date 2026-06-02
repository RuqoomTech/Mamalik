# Sprint 8 — NPC / Wild Areas

## Goal

> Add non-player targets that create safe early activity and exploration.

## Scope

- Create WildArea model
- Seed wild area types
- Add wild target map markers
- Allow scouts to scout wild areas
- Allow attacks against wild areas
- Generate resource reward reports
- Add respawn timer

## Out of scope

- Do not redesign v0.1 systems.
- Do not add v0.3 features.
- Do not introduce payments or full chat.
- Do not remove existing v0.1 gameplay behavior.

## Acceptance criteria

- Wild areas appear in valid test regions
- Protected kingdoms can interact with wild areas if allowed
- Wild areas do not grant land in v0.2
- Scout and battle reports are created
- Rewards are paid once
- Respawn timing is tracked

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
