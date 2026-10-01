import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  ArmyPanel,
  SummaryCard,
  TrainingProgressPanel,
  formatNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { ScoutOrderPanel } from "@/components/kingdom/ScoutOrderPanel";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";
import { getScoutTargetOptionsForUser } from "@/lib/kingdom/scout-target-options";

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
  // The scout target read model is keyed by user id, and `getKingdomPageData`
  // does not expose one, so the signed-in user is resolved here. The page guard
  // has already redirected when there is no session, so a null user only means
  // the session disappeared between the two reads.
  const currentUser = await getCurrentUser();
  const scoutTargets = currentUser ? await getScoutTargetOptionsForUser(currentUser.id) : [];
  const garrisonScouts = dashboardData.army
    .filter((unitStack) => unitStack.unitType === "SCOUTS" && unitStack.locationType === "GARRISON")
    .reduce((total, unitStack) => total + unitStack.quantity, 0);

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
          This page shows current unit stacks and active training. You can dispatch a scout
          order to a nearby kingdom below. Orders are recorded on dispatch and your scouts
          stay in transit for the order&apos;s travel time. Once the tick worker processes the
          arrival, that order produces an approximate scout report on the Reports page.
          The report appears on the next tick, so it is not immediate, and it carries coarse
          bands only rather than exact enemy figures. Combat, battle reports, and army
          movement orders are still upcoming Sprint 5 systems.
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
      <ScoutOrderPanel garrisonScouts={garrisonScouts} targets={scoutTargets} />
    </KingdomAppShell>
  );
}
