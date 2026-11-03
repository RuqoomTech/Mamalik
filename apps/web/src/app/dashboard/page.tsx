import Link from "next/link";
import { KingdomAppShell } from "@/components/kingdom/KingdomAppShell";
import { FoodStatusPanel, Ledger, ReportList, Section } from "@/components/kingdom/KingdomPagePanels";
import { WorldMap } from "@/components/map/WorldMap";
import { formatArea, formatRemainingMs } from "@/i18n/game-text";
import { fill, formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { toActionState } from "@/lib/kingdom/action-options";
import { getKingdomPageData } from "@/lib/kingdom/kingdom-page-data";
import { getNextSteps } from "@/lib/kingdom/next-steps";
import { getWorldKingdoms } from "@/lib/map/world-kingdoms";

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
  const [{ dashboardData, userIsAdmin }, text] = await Promise.all([getKingdomPageData(), getI18n()]);
  const { m } = text;
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const { kingdom, landTotals } = dashboardData;
  const totalUnits = dashboardData.army.reduce((total, unitStack) => total + unitStack.quantity, 0);
  const unitsInTraining = dashboardData.trainingQueues.reduce((total, queue) => total + queue.quantity, 0);
  const protectionRemainingMs = kingdom.protectionEndsAt.getTime() - Date.now();
  const worldKingdoms = await getWorldKingdoms(kingdom.id);
  const nextSteps = getNextSteps({
    state: toActionState(dashboardData),
    activeConstructionCount: dashboardData.activeConstruction.length,
    trainingQueueCount: dashboardData.trainingQueues.length,
    unallocatedLandM2: landTotals.unallocatedUsableLandM2,
  });

  return (
    <KingdomAppShell activeSection="dashboard" data={dashboardData} isAdmin={userIsAdmin}>
      {dashboardData.foodStatus.level !== "healthy" ? <FoodStatusPanel data={dashboardData} /> : null}

      {nextSteps.length > 0 ? (
        <ul className="mamalik-card divide-y divide-mk-line">
          {nextSteps.map((step) => (
            <li className="flex items-center justify-between gap-3 px-4 py-2.5" key={step.kind}>
              <span className="text-sm text-mk-ink">
                {fill(m.nextSteps[step.kind], { area: formatArea(text, step.areaM2 ?? 0) })}
              </span>
              <Link className="mamalik-action-primary shrink-0 px-3 py-1.5" href={step.href}>
                {m.nextSteps[step.cta]}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="relative">
          <WorldMap
            className="h-[260px] sm:h-[340px]"
            focus={{ lat: kingdom.centerLat, lng: kingdom.centerLng, zoom: 15 }}
            kingdoms={worldKingdoms}
            mapStyleUrl={mapStyleUrl}
          />
          <Link className="mamalik-action-secondary absolute bottom-3 start-3 px-3 py-1.5" href="/world">
            {m.dashboard.worldMap}
          </Link>
        </div>

        <Section title={m.dashboard.kingdom}>
          <Ledger>
            <tbody>
              <FactRow href="/land" label={m.resources.land} value={formatArea(text, kingdom.usableLandM2)} />
              {landTotals.unallocatedUsableLandM2 > 0 ? (
                <FactRow href="/land" label={m.dashboard.notInDistrict} value={formatArea(text, landTotals.unallocatedUsableLandM2)} />
              ) : null}
              <FactRow label={m.resources.population} value={formatNumber(kingdom.population)} />
              <FactRow
                href="/buildings"
                label={m.nav.buildings}
                value={
                  dashboardData.activeConstruction.length > 0
                    ? fill(m.dashboard.buildingsBusy, {
                        count: dashboardData.buildings.length,
                        busy: dashboardData.activeConstruction.length,
                      })
                    : formatNumber(dashboardData.buildings.length)
                }
              />
              <FactRow
                href="/army"
                label={m.dashboard.army}
                value={
                  unitsInTraining > 0 ? `${formatNumber(totalUnits)} (+${formatNumber(unitsInTraining)})` : formatNumber(totalUnits)
                }
              />
              <FactRow
                label={m.dashboard.protection}
                value={
                  protectionRemainingMs > 0
                    ? fill(m.time.left, { time: formatRemainingMs(text, protectionRemainingMs) })
                    : m.dashboard.protectionEnded
                }
              />
            </tbody>
          </Ledger>
        </Section>
      </section>

      <Section
        action={
          <Link className="text-sm text-mk-muted hover:text-mk-ink" href="/reports">
            {m.dashboard.allReports}
          </Link>
        }
        title={m.dashboard.recentActivity}
      >
        <ReportList reports={dashboardData.reports.slice(0, 5)} />
      </Section>
    </KingdomAppShell>
  );
}
