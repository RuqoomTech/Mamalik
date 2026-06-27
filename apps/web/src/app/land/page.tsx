import { getLandAreaTypeLabel } from "@mamalik/game";
import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  DistrictPanel,
  LandPurchaseSection,
  SummaryCard,
  formatLand,
} from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function LandPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell
      activeSection="land"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section>
        <p className="mamalik-eyebrow">Land and districts</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
          Kingdom land credit and district allocation
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
          Buy gameplay usable land, inspect district capacity, and assign unused
          land into existing districts. Visible-border expansion remains separate.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          detail="Gameplay capacity"
          label="Usable land"
          value={formatLand(dashboardData.landTotals.totalUsableLandM2)}
        />
        <SummaryCard
          detail="Not yet assigned to districts"
          label="Unallocated land"
          value={formatLand(dashboardData.landTotals.unallocatedUsableLandM2)}
        />
        <SummaryCard
          detail="Server-side v0.1 pricing input"
          label="Area type"
          value={getLandAreaTypeLabel(dashboardData.kingdom.areaType)}
        />
      </section>

      <LandPurchaseSection options={dashboardData.landPurchaseOptions} />
      <DistrictPanel
        districts={dashboardData.districts}
        landTotals={dashboardData.landTotals}
      />
    </KingdomAppShell>
  );
}
