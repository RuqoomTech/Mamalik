import { AttackOrderPanel } from "@/components/kingdom/AttackOrderPanel";
import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  ArmyPanel,
  SummaryCard,
  TrainingProgressPanel,
  formatNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { ScoutOrderPanel } from "@/components/kingdom/ScoutOrderPanel";
import { getCurrentUser } from "@/lib/auth/current-user";
import {
  getAttackArmyStacksForUser,
  getAttackTargetOptionsForUser,
} from "@/lib/kingdom/attack-target-options";
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
  // Same keying as the scout read model: the attack read models are keyed by
  // user id and `getKingdomPageData` does not expose one.
  const attackTargets = currentUser ? await getAttackTargetOptionsForUser(currentUser.id) : [];
  const attackArmyStacks = currentUser ? await getAttackArmyStacksForUser(currentUser.id) : [];
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
          bands only rather than exact enemy figures.
        </p>
        <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
          You can now also dispatch an ATTACK order: pick a target kingdom and compose a
          mixed army from your garrison. To be clear about what that does today, a
          dispatched attack does nothing to the target yet. The order is recorded, the
          army leaves your garrison, and it sits in transit for the order&apos;s travel
          time. No battle is fought on arrival, no casualties are dealt, no land is
          captured, and no battle report is written. The attack itself only resolves, and
          only produces a battle report, in later Sprint 5 tasks.
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

      {/*
        Scouting and attacking are separate orders with separate rules, so they
        are labelled as separate sections rather than stacked as two anonymous
        cards.
      */}
      <section className="space-y-3">
        <div>
          <p className="mamalik-eyebrow">Movement orders</p>
          <h3 className="mt-1 text-lg font-semibold text-[#10140f]">Scouting</h3>
          <p className="mt-1 max-w-3xl text-sm text-[#5f665d]">
            Send scouts to learn about a nearby kingdom. Scout orders resolve into approximate
            reports once the tick worker processes the arrival.
          </p>
        </div>
        <ScoutOrderPanel garrisonScouts={garrisonScouts} targets={scoutTargets} />
      </section>

      <section className="space-y-3">
        <div>
          <p className="mamalik-eyebrow">Movement orders</p>
          <h3 className="mt-1 text-lg font-semibold text-[#10140f]">Attacking</h3>
          <p className="mt-1 max-w-3xl text-sm text-[#5f665d]">
            Send an army against another kingdom. The attack order is recorded and the army
            marches, but the attack does not resolve and no battle report exists yet.
          </p>
        </div>
        <AttackOrderPanel armyStacks={attackArmyStacks} targets={attackTargets} />
      </section>
    </KingdomAppShell>
  );
}
