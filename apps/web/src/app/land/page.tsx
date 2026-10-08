import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import {
  DistrictPanel,
  LandPurchaseSection,
  formatLand,
} from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function LandPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const { landTotals } = dashboardData;

  return (
    <KingdomAppShell activeSection="land" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Land">
        You own {formatLand(landTotals.totalUsableLandM2)}.
        {landTotals.unallocatedUsableLandM2 > 0
          ? ` ${formatLand(landTotals.unallocatedUsableLandM2)} is not assigned to a district yet.`
          : " All of it is assigned to districts."}
      </PageIntro>
      <DistrictPanel districts={dashboardData.districts} landTotals={landTotals} />
      <LandPurchaseSection options={dashboardData.landPurchaseOptions} />
    </KingdomAppShell>
  );
}
