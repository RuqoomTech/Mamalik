# Sprint 2 — Tick Engine + Economy Loop

## Sprint goal

A created kingdom updates every 10-minute tick: resources generate, food is consumed, construction progresses, training progresses, and the player can see updated kingdom state.

## Scope

### 1. Tick worker foundation

Build the separate worker process.

Worker requirements:

- can run manually in development
- can process one tick
- can process all active kingdoms
- records tick logs
- prevents duplicate processing of the same tick
- designed for scheduled execution every 10 minutes later

### 2. Tick log model

Add model/table:

- TickLog

Fields:

- id
- tickNumber or tickStartedAt
- status
- startedAt
- finishedAt
- processedKingdomCount
- errorMessage nullable

### 3. Resource generation

Every 10-minute tick, calculate:

| Resource | Source |
|---|---|
| Money | population, Market, Tax Office |
| Food | Farm |
| Manpower | population, Houses |
| Knowledge | Scholar Hall |

Keep formulas simple for v0.1.

### 4. Food consumption

Every tick:

- population consumes Food
- army consumes Food

Initial starvation penalty:

- if Food reaches 0, population growth stops
- unit training pauses

Do not add death/starvation complexity yet.

### 5. Construction queue

Add support for:

- start construction
- start upgrade
- 1 active construction slot
- remaining ticks
- complete construction when remaining ticks reaches 0
- update building level/status

### 6. Training queue

Add support for:

- start unit training
- choose unit type
- choose quantity
- pay resource costs
- 1 active training queue
- remaining ticks
- add units when completed

### 7. Dashboard economy updates

Update dashboard to show:

- resource stockpiles
- estimated per-tick income
- food consumption
- active construction
- active training
- last tick time
- next tick countdown placeholder

### 8. Admin tick tools

Add admin tools:

- run one test tick
- view last tick
- view tick logs
- inspect kingdom resource changes

## Out of scope

- Land buying
- District reassignment
- Real automatic production balancing
- Combat tick processing
- Army movement tick processing

## Acceptance criteria

- [ ] A tick can be run manually in development.
- [ ] A kingdom produces Money, Food, Manpower, and Knowledge every tick.
- [ ] Population and army consume Food every tick.
- [ ] The same tick cannot be processed twice.
- [ ] A player can start one construction/upgrade.
- [ ] Construction progress decreases each tick.
- [ ] Construction completes correctly.
- [ ] A player can start one unit training queue.
- [ ] Training progress decreases each tick.
- [ ] Training completes and units are added correctly.
- [ ] Dashboard shows updated resources, queues, and per-tick numbers.
- [ ] Admin can run a test tick and view tick logs.

