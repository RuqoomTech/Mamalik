# 02 - v0.1 Scope

This file defines what Mamalik v0.1 must include and what is explicitly deferred.

## v0.1 Must Include

| Area | Include in v0.1 |
|---|---|
| Account | Register/login and Google login |
| Map | Real-world map screen with search, pan, and click location |
| Kingdom creation | Valid land check, editable name, 50,000 m2 land credit, starter state |
| Land | Land credit system, visible borders, districts, land packages, prices, cooldowns |
| Districts | Economic, Military, Residential, Research, Defensive |
| Economy | 10-minute tick economy, population, Food consumption |
| Buildings | Starting buildings, construction, upgrades, 1 active construction slot |
| Units | Starting units, training, 1 active training queue |
| Movement | Distance-based army movement |
| Combat | Basic attack/defense formula and defender bonuses |
| Scouting | Approximate scouting |
| Reports | Land, construction, training, scout, battle reports |
| Rankings | Total land, military power, economy score, knowledge score |
| Alliances | Simple create/join/leave alliance flow |
| Admin | Simple admin panel |

## Delayed Until After v0.1

| Feature | Reason |
|---|---|
| WebSockets/realtime | Polling is enough first |
| Full chat | Moderation and abuse risk |
| Area-type bonuses | Balance after the core loop works |
| Wood/Stone/Iron | Avoid early economy bloat |
| Advanced diplomacy | Keep alliances simple in v0.1 |
| Payments/premium | Prove the game loop first |
| Mobile app | Web first |
| Manual building placement | District system is enough |
| Advanced battle tactics | Basic formula first |

## v0.1 Release Definition

v0.1 is releasable when a player can:

1. Register/login.
2. Log in with Google.
3. Create a kingdom on a map-selected valid location.
4. Start with the locked land, resources, population, districts, buildings, and units.
5. See real land parcel style visible borders, even if initially simplified/stubbed.
6. Watch resources update through 10-minute ticks.
7. Build and upgrade buildings.
8. Train units.
9. Buy land packages with prices and cooldowns.
10. Scout and attack valid enemy kingdoms.
11. Receive reports.
12. Create, join, or leave a simple alliance.
13. Compete on v0.1 leaderboards.
14. Use/administer the system through a simple admin panel.

## v0.1 Sprint Roadmap

1. Sprint 1 - Foundation + Kingdom Creation
2. Sprint 2 - Tick Engine + Economy
3. Sprint 3 - Land Buying + District Management
4. Sprint 4 - Map Validation + Borders
5. Sprint 5 - Movement + Scouting + Combat
6. Sprint 6 - Alliances + Reports + Rankings + Admin Polish
