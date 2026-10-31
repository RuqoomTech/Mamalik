import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BATTLE_LOSER_LOSS_RATE,
  BATTLE_WINNER_LOSS_RATE,
  calculateArmyPower,
  calculateDefenderBonusMultiplier,
  DEFENSIVE_DISTRICT_BONUS_PER_POINT,
  DEFENSIVE_DISTRICT_M2_PER_BONUS_POINT,
  DEFENSE_TECH_BONUS_PER_LEVEL,
  GARRISON_DEFENSE_BONUS_MULTIPLIER,
  resolveBasicBattle,
  resolveDefendedBattle,
  UNIT_BASE_ATTACK,
  UNIT_BASE_DEFENSE,
  WALL_DEFENSE_BONUS_PER_LEVEL,
  WATCHTOWER_DEFENSE_BONUS_PER_LEVEL,
} from "./battle-formula";

describe("battle formula power", () => {
  it("sums attacker power from base attack values", () => {
    assert.equal(UNIT_BASE_ATTACK.INFANTRY, 5);
    assert.equal(UNIT_BASE_ATTACK.ARCHERS, 6);
    assert.equal(UNIT_BASE_ATTACK.CAVALRY, 9);
    assert.equal(UNIT_BASE_ATTACK.SCOUTS, 2);
    assert.equal(UNIT_BASE_ATTACK.SIEGE, 14);

    assert.equal(
      calculateArmyPower(
        [
          { unitType: "INFANTRY", quantity: 10 },
          { unitType: "ARCHERS", quantity: 4 },
        ],
        "ATTACKER",
      ),
      10 * 5 + 4 * 6,
    );
  });

  it("sums defender power from base defense values", () => {
    assert.equal(UNIT_BASE_DEFENSE.INFANTRY, 6);
    assert.equal(UNIT_BASE_DEFENSE.ARCHERS, 3);
    assert.equal(UNIT_BASE_DEFENSE.CAVALRY, 5);
    assert.equal(UNIT_BASE_DEFENSE.SCOUTS, 2);
    assert.equal(UNIT_BASE_DEFENSE.SIEGE, 3);

    assert.equal(
      calculateArmyPower(
        [
          { unitType: "INFANTRY", quantity: 10 },
          { unitType: "CAVALRY", quantity: 2 },
          { unitType: "SIEGE", quantity: 1 },
        ],
        "DEFENDER",
      ),
      10 * 6 + 2 * 5 + 1 * 3,
    );
  });

  it("uses attack values for attackers and defense values for defenders", () => {
    const army = [{ unitType: "INFANTRY", quantity: 1 }];

    assert.equal(calculateArmyPower(army, "ATTACKER"), 5);
    assert.equal(calculateArmyPower(army, "DEFENDER"), 6);
  });

  it("treats an empty manifest as zero power on both sides", () => {
    assert.equal(calculateArmyPower([], "ATTACKER"), 0);
    assert.equal(calculateArmyPower([], "DEFENDER"), 0);
  });

  it("drops unknown unit types from power", () => {
    assert.equal(
      calculateArmyPower(
        [
          { unitType: "INFANTRY", quantity: 10 },
          { unitType: "DRAGONS", quantity: 100 },
        ],
        "ATTACKER",
      ),
      50,
    );
  });

  it("drops non-positive and non-finite quantities", () => {
    assert.equal(
      calculateArmyPower(
        [
          { unitType: "INFANTRY", quantity: 0 },
          { unitType: "INFANTRY", quantity: -4 },
          { unitType: "INFANTRY", quantity: Number.NaN },
          { unitType: "INFANTRY", quantity: Number.POSITIVE_INFINITY },
          { unitType: "INFANTRY", quantity: 2 },
        ],
        "ATTACKER",
      ),
      10,
    );
  });

  it("floors fractional quantities before multiplying", () => {
    assert.equal(calculateArmyPower([{ unitType: "INFANTRY", quantity: 2.9 }], "ATTACKER"), 10);
    assert.equal(calculateArmyPower([{ unitType: "SCOUTS", quantity: 0.5 }], "ATTACKER"), 0);
  });

  it("drops non-object entries and non-array manifests", () => {
    assert.equal(
      calculateArmyPower([null, "INFANTRY", { unitType: "INFANTRY", quantity: 3 }] as never, "ATTACKER"),
      15,
    );
    assert.equal(calculateArmyPower(null, "ATTACKER"), 0);
    assert.equal(calculateArmyPower(undefined, "DEFENDER"), 0);
  });
});

describe("battle formula winner", () => {
  it("declares the attacker the winner on strictly greater power", () => {
    const result = resolveBasicBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 100 }],
      defenders: [{ unitType: "INFANTRY", quantity: 10 }],
    });

    assert.equal(result.attackerPower, 500);
    assert.equal(result.defenderPower, 60);
    assert.equal(result.winner, "ATTACKER");
  });

  it("lets the defender hold on greater power", () => {
    const result = resolveBasicBattle({
      attackers: [{ unitType: "SCOUTS", quantity: 5 }],
      defenders: [{ unitType: "CAVALRY", quantity: 10 }],
    });

    assert.equal(result.winner, "DEFENDER");
  });

  it("lets the defender hold on a tie", () => {
    const result = resolveBasicBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 6 }],
      defenders: [{ unitType: "INFANTRY", quantity: 5 }],
    });

    assert.equal(result.attackerPower, 30);
    assert.equal(result.defenderPower, 30);
    assert.equal(result.winner, "DEFENDER");
  });

  it("lets the defender hold an empty-versus-empty battle", () => {
    const result = resolveBasicBattle({ attackers: [], defenders: [] });

    assert.equal(result.attackerPower, 0);
    assert.equal(result.defenderPower, 0);
    assert.equal(result.winner, "DEFENDER");
    assert.equal(result.attackerUnitsLost, 0);
    assert.equal(result.defenderUnitsLost, 0);
  });

  it("lets the defender hold when the attacker arrives empty", () => {
    const result = resolveBasicBattle({
      attackers: [],
      defenders: [{ unitType: "INFANTRY", quantity: 3 }],
    });

    assert.equal(result.winner, "DEFENDER");
  });
});

describe("battle formula casualties", () => {
  it("takes 10 percent from the winner and 30 percent from the loser on an attacker win", () => {
    assert.equal(BATTLE_WINNER_LOSS_RATE, 0.1);
    assert.equal(BATTLE_LOSER_LOSS_RATE, 0.3);

    const result = resolveBasicBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 100 }],
      defenders: [{ unitType: "INFANTRY", quantity: 10 }],
    });

    assert.equal(result.winner, "ATTACKER");
    assert.deepEqual(result.attackerLosses, [{ unitType: "INFANTRY", quantity: 10 }]);
    assert.deepEqual(result.attackerSurvivors, [{ unitType: "INFANTRY", quantity: 90 }]);
    assert.deepEqual(result.defenderLosses, [{ unitType: "INFANTRY", quantity: 3 }]);
    assert.deepEqual(result.defenderSurvivors, [{ unitType: "INFANTRY", quantity: 7 }]);
    assert.equal(result.attackerUnitsLost, 10);
    assert.equal(result.defenderUnitsLost, 3);
    assert.equal(result.attackerUnitsSurvived, 90);
    assert.equal(result.defenderUnitsSurvived, 7);
  });

  it("takes 30 percent from the attacker and 10 percent from the defender on a hold", () => {
    const result = resolveBasicBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 10 }],
      defenders: [{ unitType: "INFANTRY", quantity: 100 }],
    });

    assert.equal(result.winner, "DEFENDER");
    assert.deepEqual(result.attackerLosses, [{ unitType: "INFANTRY", quantity: 3 }]);
    assert.deepEqual(result.attackerSurvivors, [{ unitType: "INFANTRY", quantity: 7 }]);
    assert.deepEqual(result.defenderLosses, [{ unitType: "INFANTRY", quantity: 10 }]);
    assert.deepEqual(result.defenderSurvivors, [{ unitType: "INFANTRY", quantity: 90 }]);
  });

  it("floors casualties per aggregated type and never drives survivors negative", () => {
    const result = resolveBasicBattle({
      attackers: [
        { unitType: "INFANTRY", quantity: 3 },
        { unitType: "SCOUTS", quantity: 1 },
      ],
      defenders: [{ unitType: "INFANTRY", quantity: 100 }],
    });

    assert.equal(result.winner, "DEFENDER");
    // 3 INFANTRY at 30 percent floors to 0, 1 SCOUT floors to 0.
    assert.deepEqual(result.attackerLosses, [
      { unitType: "INFANTRY", quantity: 0 },
      { unitType: "SCOUTS", quantity: 0 },
    ]);
    assert.deepEqual(result.attackerSurvivors, [
      { unitType: "INFANTRY", quantity: 3 },
      { unitType: "SCOUTS", quantity: 1 },
    ]);

    for (const survivors of [...result.attackerSurvivors, ...result.defenderSurvivors]) {
      assert.equal(survivors.quantity >= 0, true);
    }

    for (const losses of [...result.attackerLosses, ...result.defenderLosses]) {
      assert.equal(losses.quantity >= 0, true);
    }
  });

  it("aggregates duplicate entries before applying casualty rates", () => {
    const result = resolveBasicBattle({
      attackers: [
        { unitType: "INFANTRY", quantity: 60 },
        { unitType: "INFANTRY", quantity: 40 },
      ],
      defenders: [{ unitType: "INFANTRY", quantity: 1 }],
    });

    assert.equal(result.winner, "ATTACKER");
    assert.deepEqual(result.attackerLosses, [{ unitType: "INFANTRY", quantity: 10 }]);
    assert.deepEqual(result.attackerSurvivors, [{ unitType: "INFANTRY", quantity: 90 }]);
  });

  it("drops hostile entries from both armies before resolving", () => {
    const result = resolveBasicBattle({
      attackers: [
        { unitType: "INFANTRY", quantity: 100 },
        { unitType: "DRAGONS", quantity: 1000 },
        { unitType: "INFANTRY", quantity: -5 },
      ],
      defenders: [
        { unitType: "INFANTRY", quantity: 10 },
        { unitType: "GOBLINS", quantity: 500 },
      ],
    });

    assert.equal(result.attackerPower, 500);
    assert.equal(result.defenderPower, 60);
    assert.equal(result.winner, "ATTACKER");
    assert.equal(result.attackerUnitsLost, 10);
    assert.equal(result.defenderUnitsLost, 3);
  });

  it("is deterministic across repeated resolutions", () => {
    const input = {
      attackers: [
        { unitType: "CAVALRY", quantity: 7 },
        { unitType: "ARCHERS", quantity: 13 },
      ],
      defenders: [
        { unitType: "INFANTRY", quantity: 21 },
        { unitType: "SIEGE", quantity: 2 },
      ],
    };

    const first = resolveBasicBattle(input);
    const second = resolveBasicBattle(input);

    assert.deepEqual(first, second);
  });
});

describe("defender bonus multiplier (S5-007)", () => {
  it("returns 1.0 for null, undefined, or empty bonuses", () => {
    assert.equal(calculateDefenderBonusMultiplier(null), 1.0);
    assert.equal(calculateDefenderBonusMultiplier(undefined), 1.0);
    assert.equal(calculateDefenderBonusMultiplier({}), 1.0);
    assert.equal(
      calculateDefenderBonusMultiplier({
        wallLevel: 0,
        watchtowerLevel: 0,
        defensiveDistrictLandM2: 0,
        defenseTechLevel: 0,
      }),
      1.0,
    );
  });

  it("pins the S5-007 bonus constants", () => {
    assert.equal(WALL_DEFENSE_BONUS_PER_LEVEL, 0.08);
    assert.equal(WATCHTOWER_DEFENSE_BONUS_PER_LEVEL, 0.05);
    assert.equal(DEFENSIVE_DISTRICT_M2_PER_BONUS_POINT, 2000);
    assert.equal(DEFENSIVE_DISTRICT_BONUS_PER_POINT, 0.01);
    assert.equal(DEFENSE_TECH_BONUS_PER_LEVEL, 0.0);
    assert.equal(GARRISON_DEFENSE_BONUS_MULTIPLIER, 1.0);
  });

  it("scales wall levels at 8 percent per level", () => {
    assert.equal(calculateDefenderBonusMultiplier({ wallLevel: 1 }), 1.08);
    assert.ok(
      Math.abs(calculateDefenderBonusMultiplier({ wallLevel: 2 }) - 1.16) < 1e-9,
    );
  });

  it("scales watchtower levels at 5 percent per level", () => {
    assert.equal(calculateDefenderBonusMultiplier({ watchtowerLevel: 1 }), 1.05);
    assert.ok(
      Math.abs(calculateDefenderBonusMultiplier({ watchtowerLevel: 2 }) - 1.1) < 1e-9,
    );
  });

  it("awards one district point per 2000 m2 at 1 percent each", () => {
    assert.equal(
      calculateDefenderBonusMultiplier({ defensiveDistrictLandM2: 1999 }),
      1.0,
    );
    assert.equal(
      calculateDefenderBonusMultiplier({ defensiveDistrictLandM2: 2000 }),
      1.01,
    );
    assert.ok(
      Math.abs(
        calculateDefenderBonusMultiplier({ defensiveDistrictLandM2: 4000 }) - 1.02,
      ) < 1e-9,
    );
    assert.ok(
      Math.abs(
        calculateDefenderBonusMultiplier({ defensiveDistrictLandM2: 5999 }) - 1.02,
      ) < 1e-9,
    );
  });

  it("stacks wall, watchtower, and district multiplicatively", () => {
    const actual = calculateDefenderBonusMultiplier({
      wallLevel: 1,
      watchtowerLevel: 1,
      defensiveDistrictLandM2: 2000,
    });

    assert.ok(Math.abs(actual - 1.08 * 1.05 * 1.01) < 1e-9);
  });

  it("floors and clamps hostile bonus inputs instead of shrinking the defender", () => {
    assert.equal(
      calculateDefenderBonusMultiplier({
        wallLevel: -3,
        watchtowerLevel: Number.NaN,
        defensiveDistrictLandM2: -500,
        defenseTechLevel: Number.POSITIVE_INFINITY,
      }),
      1.0,
    );
    // Fractional levels floor: 1.9 behaves as level 1.
    assert.equal(calculateDefenderBonusMultiplier({ wallLevel: 1.9 }), 1.08);
    assert.equal(
      calculateDefenderBonusMultiplier({ defensiveDistrictLandM2: 3999.9 }),
      1.01,
    );
  });

  it("keeps the defense tech stub at 1.0 for any level", () => {
    assert.equal(calculateDefenderBonusMultiplier({ defenseTechLevel: 10 }), 1.0);
    assert.equal(
      calculateDefenderBonusMultiplier({ wallLevel: 2, defenseTechLevel: 99 }),
      calculateDefenderBonusMultiplier({ wallLevel: 2 }),
    );
  });

  it("keeps the garrison hook at 1.0", () => {
    assert.equal(GARRISON_DEFENSE_BONUS_MULTIPLIER, 1.0);
    assert.equal(
      calculateDefenderBonusMultiplier({ wallLevel: 1, watchtowerLevel: 1 }),
      1.08 * 1.05,
    );
  });

  it("matches the basic battle exactly with zero bonuses", () => {
    const input = {
      attackers: [{ unitType: "INFANTRY", quantity: 100 }],
      defenders: [{ unitType: "INFANTRY", quantity: 10 }],
    };

    assert.deepEqual(
      resolveDefendedBattle({ ...input, defenderBonuses: null }),
      resolveBasicBattle(input),
    );
    assert.deepEqual(
      resolveDefendedBattle({ ...input, defenderBonuses: {} }),
      resolveBasicBattle(input),
    );
  });

  it("leaves attacker power untouched and floors the defended power", () => {
    const defended = resolveDefendedBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 10 }],
      defenders: [{ unitType: "INFANTRY", quantity: 10 }],
      defenderBonuses: { wallLevel: 1 },
    });
    const base = resolveBasicBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 10 }],
      defenders: [{ unitType: "INFANTRY", quantity: 10 }],
    });

    assert.equal(defended.attackerPower, base.attackerPower);
    assert.equal(defended.attackerPower, 50);
    assert.equal(defended.defenderPower, Math.floor(60 * 1.08));
    assert.equal(defended.defenderPower, 64);
  });

  it("flips an attacker win into a defender hold and swaps casualty rates", () => {
    // Base: 7 INFANTRY attack (35) beats 5 INFANTRY defense (30).
    const base = resolveBasicBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 7 }],
      defenders: [{ unitType: "INFANTRY", quantity: 5 }],
    });
    assert.equal(base.winner, "ATTACKER");

    // Wall 3 is a 1.24 factor: floor(30 * 1.24) = 37, so the hold flips.
    const defended = resolveDefendedBattle({
      attackers: [{ unitType: "INFANTRY", quantity: 7 }],
      defenders: [{ unitType: "INFANTRY", quantity: 5 }],
      defenderBonuses: { wallLevel: 3 },
    });

    assert.equal(defended.attackerPower, 35);
    assert.equal(defended.defenderPower, 37);
    assert.equal(defended.winner, "DEFENDER");
    // Flipped rates: the attacker now takes 30 percent, the defender 10 percent.
    assert.deepEqual(defended.attackerLosses, [{ unitType: "INFANTRY", quantity: 2 }]);
    assert.deepEqual(defended.attackerSurvivors, [{ unitType: "INFANTRY", quantity: 5 }]);
    assert.deepEqual(defended.defenderLosses, [{ unitType: "INFANTRY", quantity: 0 }]);
    assert.deepEqual(defended.defenderSurvivors, [{ unitType: "INFANTRY", quantity: 5 }]);
  });

  it("is deterministic across repeated defended resolutions", () => {
    const input = {
      attackers: [{ unitType: "CAVALRY", quantity: 7 }],
      defenders: [{ unitType: "INFANTRY", quantity: 21 }],
      defenderBonuses: { wallLevel: 2, watchtowerLevel: 1, defensiveDistrictLandM2: 6000 },
    };

    assert.deepEqual(resolveDefendedBattle(input), resolveDefendedBattle(input));
  });

  it("holds an empty-versus-empty battle even with bonuses", () => {
    const result = resolveDefendedBattle({
      attackers: [],
      defenders: [],
      defenderBonuses: { wallLevel: 5, watchtowerLevel: 5, defensiveDistrictLandM2: 20000 },
    });

    assert.equal(result.attackerPower, 0);
    assert.equal(result.defenderPower, 0);
    assert.equal(result.winner, "DEFENDER");
    assert.equal(result.attackerUnitsLost, 0);
    assert.equal(result.defenderUnitsLost, 0);
  });
});
