import { BUILDING_TYPES, planNewBuilding, planTraining, type KingdomActionState } from "@mamalik/game";

export type NextStep = {
  text: string;
  href: string;
  cta: string;
};

const MIN_UNASSIGNED_LAND_HINT_M2 = 1_000;
const numberFormatter = new Intl.NumberFormat("en-US");

// Short, actionable nudges for the Overview so a player always knows what to do next.
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
      steps.push({ text: "Your builders are idle.", href: "/buildings", cta: "Build" });
    } else if (canUpgradeSomething) {
      steps.push({ text: "Your builders are idle. Save Money for the next building or upgrade.", href: "/buildings", cta: "View" });
    }
  }

  if (input.trainingQueueCount === 0 && planTraining(input.state, "INFANTRY", 1).ok) {
    steps.push({ text: "Your barracks are idle.", href: "/army", cta: "Train" });
  }

  if (input.unallocatedLandM2 >= MIN_UNASSIGNED_LAND_HINT_M2) {
    steps.push({
      text: `${numberFormatter.format(input.unallocatedLandM2)} m² of land is not in a district yet.`,
      href: "/land",
      cta: "Assign",
    });
  }

  return steps.slice(0, 3);
}
