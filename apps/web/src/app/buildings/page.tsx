import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { BuildingPanel, ConstructionProgressPanel } from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function BuildingsPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell activeSection="buildings" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Buildings">
        Buildings stand inside your districts and produce resources every tick.
      </PageIntro>
      {dashboardData.activeConstruction.length > 0 ? (
        <ConstructionProgressPanel activeConstruction={dashboardData.activeConstruction} />
      ) : null}
      <BuildingPanel buildings={dashboardData.buildings} />
    </KingdomAppShell>
  );
}
