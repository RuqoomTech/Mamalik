# 09 — Acceptance Criteria

## Sprint 1 acceptance criteria

Sprint 1 is complete when:

- user can register/login
- user without kingdom is redirected to `/create-kingdom`
- map loads
- user can select a point
- validation endpoint returns valid/invalid
- user can confirm a valid location
- user can create a kingdom
- kingdom starts with:
  - 50,000 m² usable land
  - 1,000 population
  - 10,000 Money
  - 5,000 Food
  - 500 Manpower
  - 0 Knowledge
  - 100 Infantry
  - 25 Archers
  - 5 districts
  - starter buildings
  - 3-day protection
- dashboard shows correct data
- admin can view users and kingdoms

## v0.1 acceptance criteria

v0.1 is complete when:

### Account

- email/password login works
- Google login works
- protected routes work

### Map and kingdom creation

- player can search/pan/click map
- invalid locations are rejected
- nearby valid suggestions are provided
- no kingdom can overlap another kingdom
- dynamic buffer is enforced
- kingdom visible polygon is created
- usable land credit is exact

### Economy

- tick worker runs every 10 minutes
- Money/Food/Manpower/Knowledge update correctly
- population affects taxes/manpower/food
- population and army consume Food

### Districts and buildings

- districts exist and have allocated/used/free land
- buildings consume district land
- building construction and upgrades use ticks
- one construction slot is enforced at start

### Army

- units consume Food
- one training queue is enforced at start
- unit training works

### Movement/combat/scouting

- armies travel based on distance
- far attacks are slow and expensive
- scout reports are approximate
- protected kingdoms cannot be attacked/scouted
- battle formula resolves attacks
- defender bonuses work
- siege is needed against high-level walls

### Land buying

- fixed packages work
- prices use area type and kingdom size
- package cooldowns work
- land purchase reports are created

### Alliances

- alliance create/join/leave works
- member limit is 20
- alliance members cannot attack each other
- diplomacy states are Neutral, Ally, War

### Reports and notifications

- battle/scout/land/construction reports exist
- basic notifications exist

### Rankings

- Total land ranking works
- Military power ranking works
- Economy score ranking works
- Knowledge/technology ranking works

### Admin

- admin can view users/kingdoms/reports
- admin can run test tick
- admin tooling is protected
