# Sprint 5 - Movement + Scouting + Combat

## Goal

Players can scout and attack non-protected enemy kingdoms with distance-based travel, basic battle resolution, and reports.

## Scope

- Army movement orders.
- Distance-based travel time.
- Scout orders.
- Approximate scout reports.
- Attack orders.
- Basic battle formula.
- Defender bonuses.
- Siege requirement.
- War land capture limit.
- Battle reports.

## Combat Rules

- Protected kingdoms cannot attack players.
- Protected kingdoms cannot be attacked.
- Protected kingdoms cannot be scouted by players.
- Alliance members cannot attack each other.
- Global attacks are allowed but far attacks are slow and expensive.
- Defenders get bonuses from Wall, Watchtower, Defensive District, Defense tech, and garrisoned units.
- Siege is required to seriously damage high-level walls.

## Battle Formula

```text
Attacker Power = unit attack * count * military tech bonuses
Defender Power = unit defense * count * wall/watchtower/defensive district/defense tech/garrison bonuses
```

## War Land Capture

- Winner can gain 1,000 m2 usable land credit from the same enemy once per 30 days.
- Loser loses 1,000 m2 usable land credit when capture applies.
- Do not reduce a kingdom below a safe minimum once that minimum is defined.

## Out Of Scope

- Advanced tactics.
- Formations.
- Heroes/generals.
- Morale.
- Supply lines.
- Multi-army battles.
- Alliance war coordination.

## Acceptance Criteria

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
