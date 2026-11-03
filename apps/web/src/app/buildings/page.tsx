import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { BuildTable, BuildingsTable } from "@/components/kingdom/KingdomActionTables";
import { ConstructionProgressPanel, Section } from "@/components/kingdom/KingdomPagePanels";
import { getI18n } from "@/i18n/server";
import { createBuildOptions, createUpgradeOptions } from "@/lib/kingdom/action-options";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function BuildingsPage() {
  const [{ dashboardData, userIsAdmin }, { m }] = await Promise.all([getKingdomPageData(), getI18n()]);
  const upgrades = Object.fromEntries(createUpgradeOptions(dashboardData));

  return (
    <KingdomAppShell activeSection="buildings" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title={m.buildingsPage.title}>{m.buildingsPage.intro}</PageIntro>
      {dashboardData.activeConstruction.length > 0 ? (
        <ConstructionProgressPanel activeConstruction={dashboardData.activeConstruction} />
      ) : null}
      <Section title={m.buildingsPage.yours}>
        <BuildingsTable
          buildings={dashboardData.buildings.map((building) => ({
            id: building.id,
            type: building.type,
            districtType: building.districtType,
            level: building.level,
            status: building.status,
            remainingTicks: building.constructionRemainingTicks,
          }))}
          upgrades={upgrades}
        />
      </Section>
      <Section title={m.buildingsPage.construct}>
        <BuildTable options={createBuildOptions(dashboardData)} />
      </Section>
    </KingdomAppShell>
  );
}
