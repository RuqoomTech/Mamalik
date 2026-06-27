import Link from "next/link";
import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  FoodStatusPanel,
  ResourcePanel,
  SummaryCard,
  formatCoordinate,
  formatDateTime,
  formatLand,
  formatNumber,
  formatSignedNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { KingdomBorderMapPreview } from "@/components/map/KingdomBorderMapPreview";
import {
  DASHBOARD_STATUS_NOTE,
  type KingdomDashboardData,
} from "@/lib/kingdom/dashboard-data";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

function CommandLinkCard({
  detail,
  href,
  metric,
  title,
}: {
  detail: string;
  href: string;
  metric: string;
  title: string;
}) {
  return (
    <Link className="mamalik-card block p-4 hover:border-[#b88a2c]" href={href}>
      <p className="text-sm font-semibold text-[#183f35]">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-[#10140f]">{metric}</p>
      <p className="mt-1 text-sm text-[#5f665d]">{detail}</p>
    </Link>
  );
}

function ReportsPreview({ reports }: { reports: KingdomDashboardData["reports"] }) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#10140f]">Latest reports</h2>
        <Link className="font-semibold text-[#183f35] underline" href="/reports">
          Open reports
        </Link>
      </div>
      {reports.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-3">
          {reports.slice(0, 3).map((report) => (
            <article className="mamalik-card p-4" key={report.id}>
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold text-[#183f35]">{report.typeLabel}</p>
                <span className="rounded-full border border-[#dfe5dc] px-2 py-1 text-xs text-[#5f665d]">
                  {report.read ? "Read" : "Unread"}
                </span>
              </div>
              <h3 className="mt-2 font-semibold text-[#10140f]">{report.title}</h3>
              <p className="mt-1 text-sm text-[#5f665d]">
                {report.bodySummary ?? "No summary"}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">No reports yet.</p>
      )}
    </section>
  );
}

export default async function DashboardPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const activeQueueCount =
    dashboardData.activeConstruction.length + dashboardData.trainingQueues.length;

  return (
    <KingdomAppShell
      activeSection="dashboard"
      isAdmin={userIsAdmin}
      kingdomName={dashboardData.kingdom.name}
      kingdomSlug={dashboardData.kingdom.slug}
    >
      <section className="rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-4 py-3 text-sm text-[#183f35]">
        {DASHBOARD_STATUS_NOTE}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="mamalik-eyebrow">World position</p>
              <h2 className="mt-1 text-2xl font-semibold text-[#10140f]">
                Kingdom border preview
              </h2>
            </div>
            <Link className="mamalik-action-secondary px-4 py-2" href="/world">
              Open world map
            </Link>
          </div>
          <KingdomBorderMapPreview
            centerLat={dashboardData.kingdom.centerLat}
            centerLng={dashboardData.kingdom.centerLng}
            className="h-[360px]"
            mapStyleUrl={mapStyleUrl}
            visibleBorderGeojson={dashboardData.kingdom.visibleBorderGeojson}
          />
        </div>

        <aside className="space-y-3">
          <SummaryCard
            detail={`Lat ${formatCoordinate(dashboardData.kingdom.centerLat)}, Lng ${formatCoordinate(
              dashboardData.kingdom.centerLng,
            )}`}
            label="Selected location"
            value="Map point"
          />
          <SummaryCard
            detail={`Ends ${formatDateTime(dashboardData.kingdom.protectionEndsAt)}`}
            label="Beginner protection"
            value={dashboardData.kingdom.protectionRemaining}
          />
          <SummaryCard
            detail={`Visible border ${formatLand(dashboardData.kingdom.visibleAreaM2)}`}
            label="Usable land"
            value={formatLand(dashboardData.kingdom.usableLandM2)}
          />
        </aside>
      </section>

      <ResourcePanel compact resources={dashboardData.resources} />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <CommandLinkCard
          detail={dashboardData.foodStatus.detail}
          href="/economy"
          metric={dashboardData.foodStatus.label}
          title="Economy"
        />
        <CommandLinkCard
          detail={`${formatLand(dashboardData.landTotals.unallocatedUsableLandM2)} unallocated`}
          href="/land"
          metric={formatLand(dashboardData.landTotals.totalUsableLandM2)}
          title="Land"
        />
        <CommandLinkCard
          detail={`${dashboardData.buildings.length} total buildings`}
          href="/buildings"
          metric={`${formatNumber(dashboardData.activeConstruction.length)} active`}
          title="Construction"
        />
        <CommandLinkCard
          detail={`${dashboardData.army.length} garrison stacks`}
          href="/army"
          metric={`${formatNumber(dashboardData.trainingQueues.length)} training`}
          title="Army"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          label="Population"
          value={formatNumber(dashboardData.kingdom.population)}
        />
        <SummaryCard
          detail={`${formatSignedNumber(dashboardData.economyEstimate.food.net)} Food per tick`}
          label="Food trend"
          value={dashboardData.foodStatus.label}
        />
        <SummaryCard
          detail="Construction and training queues"
          label="Active queues"
          value={formatNumber(activeQueueCount)}
        />
      </section>

      <FoodStatusPanel foodStatus={dashboardData.foodStatus} />
      <ReportsPreview reports={dashboardData.reports} />
    </KingdomAppShell>
  );
}
