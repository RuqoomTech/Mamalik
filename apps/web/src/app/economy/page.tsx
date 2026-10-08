import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { EconomyPanel, FoodStatusPanel } from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function EconomyPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell activeSection="economy" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Economy">
        Your kingdom collects resources every tick (10 minutes). Build more farms,
        markets, and houses to grow your income.
      </PageIntro>
      <FoodStatusPanel foodStatus={dashboardData.foodStatus} />
      <EconomyPanel economyEstimate={dashboardData.economyEstimate} />
    </KingdomAppShell>
  );
}
