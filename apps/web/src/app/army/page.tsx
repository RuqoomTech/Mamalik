import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { TrainTable } from "@/components/kingdom/KingdomActionTables";
import { ArmyPanel, Section, TrainingProgressPanel } from "@/components/kingdom/KingdomPagePanels";
import { getI18n } from "@/i18n/server";
import { createTrainOptions } from "@/lib/kingdom/action-options";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ArmyPage() {
  const [{ dashboardData, userIsAdmin }, { m }] = await Promise.all([getKingdomPageData(), getI18n()]);

  return (
    <KingdomAppShell activeSection="army" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title={m.armyPage.title}>{m.armyPage.intro}</PageIntro>
      {dashboardData.trainingQueues.length > 0 ? <TrainingProgressPanel trainingQueues={dashboardData.trainingQueues} /> : null}
      <Section title={m.armyPage.garrison}>
        <ArmyPanel army={dashboardData.army} />
      </Section>
      <Section title={m.armyPage.train}>
        <TrainTable options={createTrainOptions(dashboardData)} />
      </Section>
    </KingdomAppShell>
  );
}
