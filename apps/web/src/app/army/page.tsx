import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { TrainTable } from "@/components/kingdom/KingdomActionTables";
import { ArmyPanel, Section, TrainingProgressPanel } from "@/components/kingdom/KingdomPagePanels";
import { createTrainOptions } from "@/lib/kingdom/action-options";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ArmyPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell activeSection="army" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Army">
        Soldiers defend your kingdom and eat Food every tick. Train one batch at a time;
        stronger units need a higher Barracks level.
      </PageIntro>
      {dashboardData.trainingQueues.length > 0 ? (
        <TrainingProgressPanel trainingQueues={dashboardData.trainingQueues} />
      ) : null}
      <Section title="Garrison">
        <ArmyPanel army={dashboardData.army} />
      </Section>
      <Section title="Train">
        <TrainTable options={createTrainOptions(dashboardData)} />
      </Section>
    </KingdomAppShell>
  );
}
