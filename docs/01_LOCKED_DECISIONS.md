# 01 - Locked Decisions

This file is the canonical source of locked Mamalik v0.1 product and gameplay decisions.

## Identity

| System | Decision |
|---|---|
| Project name | Mamalik / ممالك |
| Genre | Browser-based tick-based grand strategy MMO |
| World | Real-world map |
| Scope | Global from day one |
| World type | Endless persistent MMO |
| Victory condition | None; leaderboard system only |
| Originality rule | Do not copy any existing game's code, UI, art, text, branding, or protected expression |

## World

- Global real-world map from day one.
- Players can start anywhere globally if the location is valid.
- Valid land only: no water, restricted zones, impossible geometry, overlap, or invalid border generation.
- Persistent endless MMO.
- No seasons.
- No final victory condition.
- Progression is leaderboard-based.

## Land And Map

| System | Decision |
|---|---|
| Starting kingdom land | 50,000 m2 usable land credit |
| Border style | Real land parcel style |
| Area model | Land credit system |
| Visible border | Virtual polygon |
| Gameplay land vs visible border | Separate systems |
| Visible border tolerance | Dynamic tolerance |
| Starting locations | Valid land only |
| Kingdom spacing | Dynamic buffer |
| Location selection | Search/pan map, click point, validate, suggest valid points |
| Kingdom naming | Suggested from player/location, editable before confirmation |

## Visible Border Tolerance

The generator tries:

1. 49,000-51,000 m2 visible polygon area.
2. 45,000-55,000 m2 if the first attempt fails.
3. Fallback generated polygon if needed.

Gameplay uses exact usable land credit even if visible polygon area is slightly above or below the target.

## Land Buying

| Package | Cooldown |
|---|---:|
| 500 m2 | none |
| 1,000 m2 | 6 hours |
| 5,000 m2 | 24 hours |
| 10,000 m2 | 48 hours |

- Land price depends on kingdom size and area type.
- War land capture allows a winner to gain 1,000 m2 usable land credit from the same enemy player once per 30 days.

## Beginner Protection

| Rule | Decision |
|---|---|
| Protection duration | 3 days |
| Protected kingdoms can attack players | No |
| Protected kingdoms can be attacked | No |
| Protected kingdoms can be scouted by players | No |
| Protected kingdoms can build/train/buy land/prepare | Yes |
| Protected kingdoms can later scout NPC/wild areas | Yes |

## Districts

| District | Starting allocation |
|---|---:|
| Economic | 15,000 m2 |
| Residential | 12,000 m2 |
| Military | 8,000 m2 |
| Defensive | 8,000 m2 |
| Research | 7,000 m2 |

- Buildings are not manually placed on the map.
- Buildings consume land inside districts.
- Allocation is fixed at start and editable later using unused land.

## Starting State

| Item | Value |
|---|---:|
| Money | 10,000 |
| Food | 5,000 |
| Manpower | 500 |
| Knowledge | 0 |
| Population | 1,000 |
| Infantry | 100 |
| Archers | 25 |

## Resources

- Money comes from taxes and markets.
- Food comes from farms and population support.
- Manpower comes from population and houses.
- Knowledge comes from scholar/research buildings.
- Resources generate every 10-minute tick.
- Population and army consume Food every tick.

## Buildings

v0.1 buildings:

- Farm
- Market
- Tax Office
- Palace
- Houses
- Barracks
- Stables later
- Watchtower
- Wall
- Scholar Hall

Rules:

- Buildings have levels.
- Construction/upgrades are measured in ticks.
- 1 active construction slot at start.
- Research uses a simple tech tree.

## Units And Combat

v0.1 units:

- Infantry
- Archers
- Cavalry
- Scouts
- Siege

Rules:

- 1 active training queue at start.
- Armies take distance-based travel time.
- Global attacks are allowed, but far attacks are slow and expensive.
- v0.1 battle formula is simple attack power versus defense power.
- Defenders get bonuses from Wall, Watchtower, Defensive District, Defense tech, and garrisoned units.
- Scouts reveal approximate enemy information.
- Siege is required to seriously damage high-level walls.

## Alliances

- Simple v0.1 alliances.
- Create, join, and leave.
- Alliance name, tag, description, and member list.
- Leader role.
- Member limit: 20.
- Alliance members cannot attack each other.
- Diplomacy states: Neutral, Ally, War.
- No full chat in v0.1, only possible alliance announcements.

## Rankings

v0.1 rankings:

- Total land
- Military power
- Economy score
- Knowledge/technology score

Alliance score is deferred until later.

## Locked Tech Stack

| Layer | Decision |
|---|---|
| Frontend | Next.js, TypeScript, Tailwind |
| Map | MapLibre GL JS |
| Backend | Next.js API routes / route handlers first |
| Database | PostgreSQL + PostGIS |
| ORM | Prisma |
| Spatial SQL | Raw SQL / TypedSQL for PostGIS-heavy operations |
| Worker | Separate tick worker process every 10 minutes |
| Realtime | Polling/refresh first; WebSockets later |
| Auth | Email/password and Google login |
| Admin | Simple admin panel in v0.1 |
