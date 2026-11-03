import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { DistrictPanel, LandPurchaseSection } from "@/components/kingdom/KingdomPagePanels";
import { formatArea } from "@/i18n/game-text";
import { fill } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function LandPage() {
  const [{ dashboardData, userIsAdmin }, text] = await Promise.all([getKingdomPageData(), getI18n()]);
  const { m } = text;
  const { landTotals } = dashboardData;

  return (
    <KingdomAppShell activeSection="land" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title={m.land.title}>
        {fill(m.land.owned, { area: formatArea(text, landTotals.totalUsableLandM2) })}{" "}
        {landTotals.unallocatedUsableLandM2 > 0
          ? fill(m.land.unassigned, { area: formatArea(text, landTotals.unallocatedUsableLandM2) })
          : m.land.allAssigned}
      </PageIntro>
      <DistrictPanel districts={dashboardData.districts} landTotals={landTotals} />
      <LandPurchaseSection options={dashboardData.landPurchaseOptions} />
    </KingdomAppShell>
  );
}
