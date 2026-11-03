import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { ReportList } from "@/components/kingdom/KingdomPagePanels";
import { getI18n } from "@/i18n/server";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [{ dashboardData, userIsAdmin }, { m }] = await Promise.all([getKingdomPageData(), getI18n()]);

  return (
    <KingdomAppShell activeSection="reports" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title={m.reports.title}>{m.reports.intro}</PageIntro>
      <ReportList reports={dashboardData.reports} />
    </KingdomAppShell>
  );
}
