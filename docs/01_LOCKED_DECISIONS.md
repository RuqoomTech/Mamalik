# 01 — Locked Decisions

## Identity

| System | Decision |
|---|---|
| Project name | Mamalik / ممالك |
| Genre | Browser-based tick-based grand strategy MMO |
| World | Real-world map |
| Scope | Global from day one |
| World type | Endless persistent MMO |
| Victory condition | None; leaderboard system only |

## Land and map

| System | Decision |
|---|---|
| Starting kingdom land | 50,000 m² usable land credit |
| Border style | Real land parcel style |
| Area model | Land credit system |
| Visible border tolerance | Dynamic tolerance |
| Starting locations | Valid land only |
| Kingdom spacing | Dynamic buffer |
| Location selection | Hybrid: search/pan, click, validate, suggest valid points |
| Kingdom naming | Hybrid suggested names + editable final name |

## Dynamic tolerance

The generator tries:

1. 49,000–51,000 m² visible polygon area.
2. 45,000–55,000 m² if the first attempt fails.
3. Custom fallback polygon if needed.

Gameplay still uses exact usable land credit even if the visible polygon is slightly above or below the target.

## Beginner protection

| Rule | Decision |
|---|---|
| Protection duration | 3 days |
| Can be attacked during protection | No |
| Can attack players during protection | No |
| Can be scouted by players during protection | No |
| Can buy land during protection | Yes |
| Can build/train/research during protection | Yes |
| Can scout NPC/wild areas later | Yes |

## Land buying

| System | Decision |
|---|---|
| Pricing model | Hybrid: kingdom size + area type |
| Purchase amount | Fixed packages |
| Packages | 500, 1,000, 5,000, 10,000 m² |
| Cooldown model | Soft cooldown per package |

| Package | Cooldown |
|---|---:|
| 500 m² | none |
| 1,000 m² | 6 hours |
| 5,000 m² | 24 hours |
| 10,000 m² | 48 hours |

## Districts and buildings

| System | Decision |
|---|---|
| Building placement | District system |
| Districts | Economic, Military, Residential, Research, Defensive |
| District allocation | Fixed start, editable later |
| Starting buildings | Basic starter buildings; area bonuses later |
| Buildings have levels | Yes |
| Construction time | Measured in ticks |
| Starting construction slots | 1 |

## Economy

| System | Decision |
|---|---|
| Tick speed | 10 minutes |
| v0.1 resources | Money, Food, Manpower, Knowledge |
| Future resources | Wood, Stone, Iron later if needed |
| Starting Money | 10,000 |
| Starting Food | 5,000 |
| Starting Manpower | 500 |
| Starting Knowledge | 0 |
| Starting population | 1,000 |
| Population affects | Taxes, manpower growth, food consumption |
| Food consumption | Population and army consume food every tick |
| Research | Simple tech tree |

## Units and combat

| System | Decision |
|---|---|
| Starting army | 100 Infantry, 25 Archers |
| v0.1 unit types | Infantry, Archers, Cavalry, Scouts, Siege |
| Unit upkeep | Units consume Food every tick |
| Starting training queues | 1 |
| Army movement | Distance-based travel time |
| Global attacks | Allowed, but far attacks are slow and expensive |
| Battle formula | Simple attack power vs defense power |
| Defender bonuses | Wall, Watchtower, Defensive District, Defense tech, garrisoned units |
| Scouting | Approximate enemy information |
| Siege | Required to seriously damage high-level walls |
| War land capture | Winner can gain 1,000 m² from same enemy per 30 days |

## Alliances and interaction

| System | Decision |
|---|---|
| Alliances | Simple v0.1 alliances |
| Member limit | 20 members |
| Friendly fire | Alliance members cannot attack each other |
| Diplomacy states | Neutral, Ally, War |
| Chat | Not in v0.1, except possible simple alliance announcements |
| Notifications | Basic notifications in v0.1 |
| Reports | Battle, scout, land purchase, construction reports |

## Rankings

v0.1 rankings:

- Total land
- Military power
- Economy score
- Knowledge/technology score

Alliance score comes later.

