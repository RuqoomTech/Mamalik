import { KingdomAppShell, PageIntro } from "@/components/kingdom/KingdomAppShell";
import { ReportList } from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();

  return (
    <KingdomAppShell activeSection="reports" data={dashboardData} isAdmin={userIsAdmin}>
      <PageIntro title="Reports">
        Land purchases, finished buildings, and trained units are recorded here.
      </PageIntro>
      <ReportList reports={dashboardData.reports} />
    </KingdomAppShell>
  );
}
