import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { BuildTable, BuildingsTable } from "@/components/kingdom/KingdomActionTables";
import { ConstructionProgressPanel, Section } from "@/components/kingdom/KingdomPagePanels";
import { createBuildOptions, createUpgradeOptions } from "@/lib/kingdom/action-options";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function BuildingsPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const upgrades = Object.fromEntries(createUpgradeOptions(dashboardData));

  return (
    <KingdomAppShell activeSection="buildings" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Buildings">
        One building can be under construction at a time. New buildings need free land in
        their district; upgrades use the same land.
      </PageIntro>
      {dashboardData.activeConstruction.length > 0 ? (
        <ConstructionProgressPanel activeConstruction={dashboardData.activeConstruction} />
      ) : null}
      <Section title="Your buildings">
        <BuildingsTable
          buildings={dashboardData.buildings.map((building) => ({
            id: building.id,
            label: building.label,
            districtLabel: building.districtLabel,
            level: building.level,
            status: building.status,
            statusText: `${building.statusLabel}, ${building.constructionRemainingTicks} tick${
              building.constructionRemainingTicks === 1 ? "" : "s"
            } left`,
          }))}
          upgrades={upgrades}
        />
      </Section>
      <Section title="Construct">
        <BuildTable options={createBuildOptions(dashboardData)} />
      </Section>
    </KingdomAppShell>
  );
}
