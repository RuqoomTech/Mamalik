import { BUILDING_TYPES, planNewBuilding, planTraining, type KingdomActionState } from "@mamalik/game";

export type NextStep = {
  kind: "buildersIdle" | "buildersIdleSave" | "barracksIdle" | "landUnassigned";
  href: string;
  cta: "build" | "view" | "train" | "assign";
  areaM2?: number;
};

const MIN_UNASSIGNED_LAND_HINT_M2 = 1_000;

// Short, actionable nudges for the Overview so a player always knows what to do next.
// The page turns each kind into localized text.
export function getNextSteps(input: {
  state: KingdomActionState;
  activeConstructionCount: number;
  trainingQueueCount: number;
  unallocatedLandM2: number;
}): NextStep[] {
  const steps: NextStep[] = [];

  if (input.activeConstructionCount === 0) {
    const canBuildSomething = BUILDING_TYPES.some((type) => planNewBuilding(input.state, type).ok);
    const canUpgradeSomething = input.state.buildings.length > 0;

    if (canBuildSomething) {
      steps.push({ kind: "buildersIdle", href: "/buildings", cta: "build" });
    } else if (canUpgradeSomething) {
      steps.push({ kind: "buildersIdleSave", href: "/buildings", cta: "view" });
    }
  }

  if (input.trainingQueueCount === 0 && planTraining(input.state, "INFANTRY", 1).ok) {
    steps.push({ kind: "barracksIdle", href: "/army", cta: "train" });
  }

  if (input.unallocatedLandM2 >= MIN_UNASSIGNED_LAND_HINT_M2) {
    steps.push({ kind: "landUnassigned", href: "/land", cta: "assign", areaM2: input.unallocatedLandM2 });
  }

  return steps.slice(0, 3);
}
