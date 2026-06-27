import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  ArmyPanel,
  SummaryCard,
  TrainingProgressPanel,
  formatNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ArmyPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const totalUnits = dashboardData.army.reduce(
    (total, unitStack) => total + unitStack.quantity,
    0,
  );
  const trainingUnits = dashboardData.trainingQueues.reduce(
    (total, queue) => total + queue.quantity,
    0,
  );

  return (
    <KingdomAppShell
      activeSection="army"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section>
        <p className="mamalik-eyebrow">Army</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
          Garrison and training queues
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
          This page shows current unit stacks and active training. Movement,
          scouting, and combat remain Sprint 5 systems.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          detail="Across visible unit stacks"
          label="Garrisoned units"
          value={formatNumber(totalUnits)}
        />
        <SummaryCard
          detail="Queued unit quantity"
          label="Training units"
          value={formatNumber(trainingUnits)}
        />
        <SummaryCard
          detail="Population and army per-tick cost"
          label="Army Food cost"
          value={formatNumber(dashboardData.economyEstimate.food.armyConsumption)}
        />
      </section>

      <TrainingProgressPanel trainingQueues={dashboardData.trainingQueues} />
      <ArmyPanel army={dashboardData.army} />
    </KingdomAppShell>
  );
}
