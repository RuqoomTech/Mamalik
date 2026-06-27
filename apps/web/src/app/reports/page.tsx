import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  ReportsPanel,
  SummaryCard,
  formatNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const unreadCount = dashboardData.reports.filter((report) => !report.read).length;

  return (
    <KingdomAppShell
      activeSection="reports"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section>
        <p className="mamalik-eyebrow">Reports</p>
        <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
          Latest kingdom activity
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-[#5f665d]">
          This read-only center shows recent land, construction, training, and
          future scouting or battle reports.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <SummaryCard
          detail="Loaded for this kingdom"
          label="Recent reports"
          value={formatNumber(dashboardData.reports.length)}
        />
        <SummaryCard
          detail="Unread in the latest activity set"
          label="Unread"
          value={formatNumber(unreadCount)}
        />
      </section>

      <ReportsPanel reports={dashboardData.reports} />
    </KingdomAppShell>
  );
}
