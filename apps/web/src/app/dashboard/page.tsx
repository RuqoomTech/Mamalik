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
import { WorldMap } from "@/components/map/WorldMap";
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
  const { dashboardData, userIsAdmin } = await getKingdomPageData();
  const mapStyleUrl = process.env.NEXT_PUBLIC_MAP_STYLE_URL ?? "";
  const { kingdom, landTotals } = dashboardData;
  const totalUnits = dashboardData.army.reduce((total, unitStack) => total + unitStack.quantity, 0);
  const unitsInTraining = dashboardData.trainingQueues.reduce((total, queue) => total + queue.quantity, 0);
  const isProtected = kingdom.protectionRemaining !== "Protection ended";
  const worldKingdoms = await getWorldKingdoms(kingdom.id);
  const nextSteps = getNextSteps({
    state: toActionState(dashboardData),
    activeConstructionCount: dashboardData.activeConstruction.length,
    trainingQueueCount: dashboardData.trainingQueues.length,
    unallocatedLandM2: landTotals.unallocatedUsableLandM2,
  });

  return (
    <KingdomAppShell activeSection="dashboard" data={dashboardData} isAdmin={userIsAdmin}>
      {dashboardData.foodStatus.level !== "healthy" ? (
        <FoodStatusPanel foodStatus={dashboardData.foodStatus} />
      ) : null}

      {nextSteps.length > 0 ? (
        <ul className="mamalik-card divide-y divide-mk-line">
          {nextSteps.map((step) => (
            <li className="flex items-center justify-between gap-3 px-4 py-2.5" key={step.href}>
              <span className="text-sm text-mk-ink">{step.text}</span>
              <Link className="mamalik-action-primary shrink-0 px-3 py-1.5" href={step.href}>
                {step.cta}
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
          <Link
            className="mamalik-action-secondary absolute bottom-3 left-3 px-3 py-1.5"
            href="/world"
          >
            World map
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
