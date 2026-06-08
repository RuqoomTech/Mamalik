# Sprint 5 — Movement + Scouting + Combat

## Sprint goal

Players can scout and attack non-protected enemy kingdoms with distance-based travel, basic battle resolution, and reports.

## Scope

### 1. Army movement orders

Add movement/order model.

Order types:

- SCOUT
- ATTACK
- RETURN

Fields:

- id
- sourceKingdomId
- targetKingdomId
- orderType
- units
- status
- departureAt
- arrivalAt
- returnAt nullable
- distanceM
- travelTicks

### 2. Distance-based travel time

Implement formula based on real-world distance.

Requirements:

- near attacks are reasonably fast
- global attacks are allowed
- far attacks are slow and expensive
- travel time measured in ticks

### 3. Scout orders

Implement Scouts as unit type.

Scout rules:

- cannot scout protected kingdoms
- cannot scout alliance members unless later allowed for friendly info
- returns approximate enemy information
- scout accuracy can improve later with tech

### 4. Scout reports

Approximate report examples:

- enemy army: small / medium / large
- defense: weak / normal / strong
- food: low / medium / high
- land size: approximate
- wall level: unknown / low / medium / high

### 5. Attack orders

Attack rules:

- cannot attack protected kingdoms
- cannot attack alliance members
- can attack Neutral or War targets
- global attacks allowed, but slow/expensive
- units leave source kingdom and return after battle

### 6. Battle formula

v0.1 formula:

```text
Attacker Power = unit attack × count × military tech bonuses
Defender Power = unit defense × count × wall/watchtower/defensive district/defense tech/garrison bonuses
```

Winner is higher effective power. Both sides take losses based on power ratio.

### 7. Defender bonuses

Implement locked bonuses:

- Wall
- Watchtower
- Defensive District
- Defense tech
- Garrisoned units

### 8. Siege rule

Siege is required to seriously damage high-level walls.

Without Siege:

- attacker can still beat weak kingdoms
- high-level walls resist serious damage

### 9. War land capture

Implement the 30-day land capture limit:

- winner can gain 1,000 m² usable land from the same enemy once per 30 days
- loser loses 1,000 m² usable land
- never reduce a kingdom below a safe minimum later to be defined
- create land capture report

### 10. Battle reports

Report includes:

- attacker
- defender
- outcome
- units sent
- units lost
- defender losses
- land captured if any
- resources looted if later enabled

## Out of scope

- Advanced tactics
- Formations
- Heroes/generals
- Morale
- Supply lines
- Multi-army battles
- Alliance war coordination

## Acceptance criteria

- [ ] Player can send scout order to valid target.
- [ ] Scout order uses distance-based travel time.
- [ ] Scout report is created on arrival.
- [ ] Scout report shows approximate information.
- [ ] Protected kingdoms cannot be scouted.
- [ ] Player can send attack order to valid target.
- [ ] Attack order uses distance-based travel time.
- [ ] Protected kingdoms cannot be attacked.
- [ ] Alliance members cannot be attacked.
- [ ] Battle resolves with simple power formula.
- [ ] Defender bonuses are applied.
- [ ] Siege requirement works for high-level walls.
- [ ] War land capture limit is enforced per enemy per 30 days.
- [ ] Battle report is created.

