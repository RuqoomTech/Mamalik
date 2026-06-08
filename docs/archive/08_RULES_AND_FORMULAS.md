# 08 — Rules and Formula Drafts

## Land credit

```text
usableLandM2 = exact gameplay land
visibleAreaM2 = approximate visual polygon area
```

Buildings and districts consume usable land, not visible polygon area.

## Starting kingdom

```text
usableLandM2 = 50,000
population = 1,000
money = 10,000
food = 5,000
manpower = 500
knowledge = 0
infantry = 100
archers = 25
```

## Visible border dynamic tolerance

```text
Attempt 1: 49,000–51,000 m²
Attempt 2: 45,000–55,000 m²
Fallback: custom generated polygon
```

## Land buying formula

```text
landCost = packageM2 × basePricePerM2 × areaTypeMultiplier × kingdomSizeMultiplier
```

Suggested placeholder values:

```text
basePricePerM2 = 10 Money
```

### Area type multiplier draft

| Area type | Multiplier |
|---|---:|
| Dense city | 2.0 |
| Urban/suburb | 1.5 |
| Normal town | 1.2 |
| Rural/farmland | 0.9 |
| Desert/open land | 0.6 |
| Commercial/industrial | 2.2 |
| Unknown fallback | 1.2 |

### Kingdom size multiplier draft

| Kingdom usable land | Multiplier |
|---|---:|
| 50,000–100,000 m² | 1.0 |
| 100,001–250,000 m² | 1.4 |
| 250,001–500,000 m² | 2.0 |
| 500,001–1,000,000 m² | 3.0 |
| 1,000,000+ m² | 5.0 |

## Land package cooldowns

| Package | Cooldown |
|---|---:|
| 500 m² | none |
| 1,000 m² | 6 hours |
| 5,000 m² | 24 hours |
| 10,000 m² | 48 hours |

## War land capture

```text
maxLandCaptureFromSameEnemy = 1,000 m² per 30 days
```

If Omar defeats Ahmed:

```text
Omar usableLandM2 += 1000
Ahmed usableLandM2 -= 1000
ledger cooldown starts for Omar -> Ahmed for 30 days
```

## Resource generation draft

Every 10-minute tick:

```text
money += taxIncome + marketIncome
food += farmProduction - populationFoodConsumption - armyFoodConsumption
manpower += populationManpowerGrowth + housesBonus
knowledge += scholarHallProduction
```

## Food shortage draft

For v0.1, keep consequences simple:

```text
if food <= 0:
  food = 0
  populationGrowth = 0
  trainingBlocked = true or trainingSlowed = true
```

Do not add starvation death in v0.1 unless needed.

## Battle formula draft

```text
attackerPower =
  sum(unitCount × unitAttack)
  × militaryTechMultiplier
  × distancePenaltyOrSupplyModifier

defenderPower =
  sum(unitCount × unitDefense)
  × wallMultiplier
  × watchtowerMultiplier
  × defensiveDistrictMultiplier
  × defenseTechMultiplier
  × garrisonMultiplier
```

Result:

```text
if attackerPower > defenderPower:
  attacker wins
else:
  defender holds
```

Losses:

```text
lossRatio = loserPower / winnerPower
winnerLosses = small percentage scaled by lossRatio
loserLosses = larger percentage scaled by power gap
```

## Scouting result precision

Low scouting should report ranges, not exact numbers.

Example:

```text
Army: small / medium / large
Defense: weak / normal / strong
Food: low / medium / high
Wall: unknown / low / medium / high
```

## Travel time draft

```text
travelTicks = ceil(distanceKm / speedKmPerTick)
minimumTravelTicks = 3
```

Far attacks should also cost more Food/Money.
