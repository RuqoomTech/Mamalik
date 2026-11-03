import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { EconomyPanel, FoodStatusPanel } from "@/components/kingdom/KingdomPagePanels";
import { getI18n } from "@/i18n/server";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function EconomyPage() {
  const [{ dashboardData, userIsAdmin }, { m }] = await Promise.all([getKingdomPageData(), getI18n()]);

  return (
    <KingdomAppShell activeSection="economy" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title={m.economy.title}>{m.economy.intro}</PageIntro>
      <FoodStatusPanel data={dashboardData} />
      <EconomyPanel economyEstimate={dashboardData.economyEstimate} />
    </KingdomAppShell>
  );
}
