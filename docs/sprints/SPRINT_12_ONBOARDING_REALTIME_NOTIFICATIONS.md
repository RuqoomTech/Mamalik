# Sprint 12 — Onboarding Quests + Important Notifications

## Goal

> Improve retention and make important events visible without making the whole game realtime.

## Scope

- Add quest definitions
- Add quest progress tracking
- Add first-hour quest chain
- Add rewards
- Add realtime notification transport or polling fallback
- Add notification preferences
- Add alliance announcement notifications

## Out of scope

- Do not redesign v0.1 systems.
- Do not add v0.3 features.
- Do not introduce payments or full chat.
- Do not remove existing v0.1 gameplay behavior.

## Acceptance criteria

- New kingdoms receive onboarding quests
- Quest progress updates from real actions
- Quest rewards cannot be claimed twice
- Important notifications appear promptly
- Polling fallback works if realtime is disabled
- No full chat is introduced

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
