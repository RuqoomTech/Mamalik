import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { ArmyPanel, TrainingProgressPanel } from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ArmyPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell activeSection="army" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Army">
        Soldiers defend your kingdom and eat Food every tick. Scouting and battles are coming soon.
      </PageIntro>
      <ArmyPanel army={dashboardData.army} />
      {dashboardData.trainingQueues.length > 0 ? (
        <TrainingProgressPanel trainingQueues={dashboardData.trainingQueues} />
      ) : null}
    </KingdomAppShell>
  );
}
