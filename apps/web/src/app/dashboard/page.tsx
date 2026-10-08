import Link from "next/link";
import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import {
  FoodStatusPanel,
  Ledger,
  ReportList,
  Section,
  formatLand,
  formatNumber,
} from "@/components/kingdom/KingdomPagePanels";
import { KingdomBorderMapPreview } from "@/components/map/KingdomBorderMapPreview";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";

export const dynamic = "force-dynamic";

function FactRow({ href, label, value }: { href?: string; label: string; value: string }) {
  return (
    <tr>
      <td className="text-mk-muted">{label}</td>
      <td className="num font-medium">
        {href ? (
          <Link className="hover:underline" href={href}>
            {value}
          </Link>
        ) : (
          value
        )}
      </td>
    </tr>
  );
}

export default async function DashboardPage() {
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const { kingdom, landTotals } = dashboardData;
  const totalUnits = dashboardData.army.reduce((total, unitStack) => total + unitStack.quantity, 0);
  const unitsInTraining = dashboardData.trainingQueues.reduce((total, queue) => total + queue.quantity, 0);
  const isProtected = kingdom.protectionRemaining !== "Protection ended";

  return (
    <KingdomAppShell activeSection="dashboard" data={dashboardData} isAdmin={userIsAdmin}>
      {dashboardData.foodStatus.level !== "healthy" ? (
        <FoodStatusPanel foodStatus={dashboardData.foodStatus} />
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="relative overflow-hidden rounded-md border border-mk-line">
          <KingdomBorderMapPreview
            centerLat={kingdom.centerLat}
            centerLng={kingdom.centerLng}
            className="h-[260px] sm:h-[340px]"
            mapStyleUrl={mapStyleUrl}
            visibleBorderGeojson={kingdom.visibleBorderGeojson}
          />
          <Link
            className="mamalik-action-secondary absolute bottom-3 left-3 px-3 py-1.5"
            href="/world"
          >
            Open map
          </Link>
        </div>

        <Section title="Kingdom">
          <Ledger>
            <tbody>
              <FactRow href="/land" label="Land" value={formatLand(kingdom.usableLandM2)} />
              {landTotals.unallocatedUsableLandM2 > 0 ? (
                <FactRow
                  href="/land"
                  label="Not in a district"
                  value={formatLand(landTotals.unallocatedUsableLandM2)}
                />
              ) : null}
              <FactRow label="Population" value={formatNumber(kingdom.population)} />
              <FactRow
                href="/buildings"
                label="Buildings"
                value={
                  dashboardData.activeConstruction.length > 0
                    ? `${formatNumber(dashboardData.buildings.length)} (${dashboardData.activeConstruction.length} building)`
                    : formatNumber(dashboardData.buildings.length)
                }
              />
              <FactRow
                href="/army"
                label="Army"
                value={
                  unitsInTraining > 0
                    ? `${formatNumber(totalUnits)} (+${formatNumber(unitsInTraining)})`
                    : formatNumber(totalUnits)
                }
              />
              <FactRow
                label="Protection"
                value={isProtected ? `${kingdom.protectionRemaining} left` : "Ended"}
              />
            </tbody>
          </Ledger>
        </Section>
      </section>

      <Section
        action={
          <Link className="text-sm text-mk-muted hover:text-mk-ink" href="/reports">
            All reports
          </Link>
        }
        title="Recent activity"
      >
        <ReportList reports={dashboardData.reports.slice(0, 5)} />
      </Section>
    </KingdomAppShell>
  );
}
