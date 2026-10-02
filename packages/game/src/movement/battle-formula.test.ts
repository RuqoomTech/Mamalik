import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BATTLE_LOSER_LOSS_RATE,
  BATTLE_WINNER_LOSS_RATE,
  calculateArmyPower,
  resolveBasicBattle,
  UNIT_BASE_ATTACK,
  UNIT_BASE_DEFENSE,
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
