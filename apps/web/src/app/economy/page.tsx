import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  EconomyPanel,
  FoodStatusPanel,
  LatestTickPanel,
  ResourcePanel,
  SummaryCard,
  formatNumber,
  formatSignedNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function EconomyPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell
      activeSection="economy"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section>
        <p className="mamalik-eyebrow">Economy</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
          Resources and tick balance
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
          This page shows current stockpiles, deterministic per-tick estimates,
          Food health, and recent tick activity.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Population"
          value={formatNumber(dashboardData.kingdom.population)}
        />
        <SummaryCard
          detail="After generation and consumption"
          label="Net Food per tick"
          value={formatSignedNumber(dashboardData.economyEstimate.food.net)}
        />
        <SummaryCard
          detail="Money generated before spending"
          label="Money per tick"
          value={formatSignedNumber(dashboardData.economyEstimate.money.total)}
        />
      </section>

      <ResourcePanel resources={dashboardData.resources} />
      <EconomyPanel economyEstimate={dashboardData.economyEstimate} />
      <FoodStatusPanel foodStatus={dashboardData.foodStatus} />
      <LatestTickPanel ticks={dashboardData.latestTicks} />
    </KingdomAppShell>
  );
}
