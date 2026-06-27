import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  BuildingPanel,
  ConstructionProgressPanel,
  SummaryCard,
  formatLand,
  formatNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function BuildingsPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const activeConstructionCount = dashboardData.activeConstruction.length;

  return (
    <KingdomAppShell
      activeSection="buildings"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section>
        <p className="mamalik-eyebrow">Buildings</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
          Structures and construction state
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
          This page is focused on existing buildings, district land usage, and
          construction progress. Start-construction actions remain future v0.1 work.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          detail="All current building rows"
          label="Buildings"
          value={formatNumber(dashboardData.buildings.length)}
        />
        <SummaryCard
          detail="Constructing or upgrading"
          label="Active construction"
          value={formatNumber(activeConstructionCount)}
        />
        <SummaryCard
          detail="District usage source"
          label="Used land"
          value={formatLand(dashboardData.landTotals.totalDistrictUsedLandM2)}
        />
      </section>

      <ConstructionProgressPanel activeConstruction={dashboardData.activeConstruction} />
      <BuildingPanel buildings={dashboardData.buildings} />
    </KingdomAppShell>
  );
}
