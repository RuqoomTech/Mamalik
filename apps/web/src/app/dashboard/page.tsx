import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithKingdom } from "@/lib/auth/guards";
import { isAdminUser } from "@/lib/auth/route-destinations";
import {
  DASHBOARD_STATUS_NOTE,
  getKingdomDashboardData,
  type FoodStatusLevel,
  type KingdomDashboardData,
} from "@/lib/kingdom/dashboard-data";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

const numberFormatter = new Intl.NumberFormat("en-US");
const coordinateFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 6,
  minimumFractionDigits: 6,
});
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatSignedNumber(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

function formatLand(value: number): string {
  return `${formatNumber(value)} m2`;
}

function formatCoordinate(value: number): string {
  return coordinateFormatter.format(value);
}

function formatDateTime(value: Date): string {
  return `${dateFormatter.format(value)} UTC`;
}

function formatOptionalDateTime(value: Date | null): string {
  return value ? formatDateTime(value) : "Not finished";
}

function formatTicks(value: number): string {
  return `${formatNumber(value)} tick${value === 1 ? "" : "s"}`;
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="mamalik-card p-4">
      <p className="text-sm text-[#5f665d]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#10140f]">{value}</p>
      {detail ? <p className="mt-1 text-sm text-[#5f665d]">{detail}</p> : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-[#10140f]">{title}</h2>
      {children}
    </section>
  );
}

function TableCard({
  children,
  minWidth,
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="mamalik-card overflow-x-auto p-4">
      <table className={`mamalik-table text-sm ${minWidth ?? "min-w-[640px]"}`}>
        {children}
      </table>
    </div>
  );
}

function ResourcePanel({ resources }: { resources: KingdomDashboardData["resources"] }) {
  return (
    <Section title="Resource stockpiles">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Money" value={formatNumber(resources.money)} />
        <SummaryCard label="Food" value={formatNumber(resources.food)} />
        <SummaryCard label="Manpower" value={formatNumber(resources.manpower)} />
        <SummaryCard label="Knowledge" value={formatNumber(resources.knowledge)} />
      </dl>
    </Section>
  );
}

function EconomyPanel({
  economyEstimate,
}: {
  economyEstimate: KingdomDashboardData["economyEstimate"];
}) {
  return (
    <Section title="Per-tick economy estimate">
      <TableCard minWidth="min-w-[720px]">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Source</th>
            <th>Per tick</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="font-medium text-[#10140f]">Money</td>
            <td className="text-[#5f665d]">Population tax</td>
            <td className="text-[#183f35]">
              {formatSignedNumber(economyEstimate.money.populationTax)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Money</td>
            <td className="text-[#5f665d]">Market, Tax Office, Palace bonuses</td>
            <td className="text-[#183f35]">
              {formatSignedNumber(
                economyEstimate.money.marketBonus +
                  economyEstimate.money.taxOfficeBonus +
                  economyEstimate.money.palaceBonus,
              )}
            </td>
          </tr>
          <tr>
            <td className="font-semibold text-[#10140f]">Money</td>
            <td className="font-semibold text-[#10140f]">Total generated</td>
            <td className="font-semibold text-[#183f35]">
              {formatSignedNumber(economyEstimate.money.total)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Food</td>
            <td className="text-[#5f665d]">Farm production</td>
            <td className="text-[#183f35]">
              {formatSignedNumber(economyEstimate.food.generatedTotal)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Food</td>
            <td className="text-[#5f665d]">Population consumption</td>
            <td className="text-[#8a4f19]">
              -{formatNumber(economyEstimate.food.populationConsumption)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Food</td>
            <td className="text-[#5f665d]">Army consumption</td>
            <td className="text-[#8a4f19]">
              -{formatNumber(economyEstimate.food.armyConsumption)}
            </td>
          </tr>
          <tr>
            <td className="font-semibold text-[#10140f]">Food</td>
            <td className="font-semibold text-[#10140f]">Net change</td>
            <td
              className={
                economyEstimate.food.net >= 0
                  ? "font-semibold text-[#183f35]"
                  : "font-semibold text-[#9f3030]"
              }
            >
              {formatSignedNumber(economyEstimate.food.net)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Manpower</td>
            <td className="text-[#5f665d]">Population manpower</td>
            <td className="text-[#183f35]">
              {formatSignedNumber(economyEstimate.manpower.populationManpowerGrowth)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Manpower</td>
            <td className="text-[#5f665d]">Houses bonus</td>
            <td className="text-[#183f35]">
              {formatSignedNumber(economyEstimate.manpower.housesBonus)}
            </td>
          </tr>
          <tr>
            <td className="font-semibold text-[#10140f]">Manpower</td>
            <td className="font-semibold text-[#10140f]">Total generated</td>
            <td className="font-semibold text-[#183f35]">
              {formatSignedNumber(economyEstimate.manpower.total)}
            </td>
          </tr>
          <tr>
            <td className="font-medium text-[#10140f]">Knowledge</td>
            <td className="text-[#5f665d]">Scholar Hall production</td>
            <td className="text-[#183f35]">
              {formatSignedNumber(economyEstimate.knowledge.scholarHallProduction)}
            </td>
          </tr>
        </tbody>
      </TableCard>
    </Section>
  );
}

function getFoodStatusClass(level: FoodStatusLevel): string {
  switch (level) {
    case "shortage":
      return "border-[#e1b8b8] bg-[#fff0f0] text-[#7a1d1d]";
    case "warning":
      return "border-[#e7d6a0] bg-[#fff9e7] text-[#6a4a0a]";
    case "healthy":
      return "border-[#cbd8cd] bg-[#eff6ed] text-[#183f35]";
  }
}

function FoodStatusPanel({ foodStatus }: { foodStatus: KingdomDashboardData["foodStatus"] }) {
  return (
    <Section title="Food status">
      <div className={`rounded-md border px-4 py-3 ${getFoodStatusClass(foodStatus.level)}`}>
        <p className="font-semibold">{foodStatus.label}</p>
        <p className="mt-1 text-sm">{foodStatus.detail}</p>
      </div>
    </Section>
  );
}

function DistrictPanel({ districts }: { districts: KingdomDashboardData["districts"] }) {
  return (
    <Section title="Districts">
      <TableCard minWidth="min-w-[560px]">
        <thead>
          <tr>
            <th>District</th>
            <th>Allocated</th>
            <th>Used</th>
            <th>Free</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr key={district.id}>
              <td className="font-medium text-[#10140f]">{district.label}</td>
              <td className="text-[#5f665d]">{formatLand(district.allocatedLandM2)}</td>
              <td className="text-[#5f665d]">{formatLand(district.usedLandM2)}</td>
              <td className="text-[#5f665d]">{formatLand(district.freeLandM2)}</td>
            </tr>
          ))}
        </tbody>
      </TableCard>
    </Section>
  );
}

function BuildingPanel({ buildings }: { buildings: KingdomDashboardData["buildings"] }) {
  return (
    <Section title="Buildings">
      {buildings.length > 0 ? (
        <TableCard minWidth="min-w-[760px]">
          <thead>
            <tr>
              <th>Building</th>
              <th>Level</th>
              <th>Status</th>
              <th>Land</th>
              <th>District</th>
              <th>Remaining</th>
            </tr>
          </thead>
          <tbody>
            {buildings.map((building) => (
              <tr key={building.id}>
                <td className="font-medium text-[#10140f]">{building.label}</td>
                <td className="text-[#5f665d]">{building.level}</td>
                <td className="text-[#5f665d]">{building.statusLabel}</td>
                <td className="text-[#5f665d]">{formatLand(building.landUsedM2)}</td>
                <td className="text-[#5f665d]">{building.districtLabel}</td>
                <td className="text-[#5f665d]">
                  {building.constructionRemainingTicks > 0
                    ? formatTicks(building.constructionRemainingTicks)
                    : "Complete"}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">No buildings exist yet.</p>
      )}
    </Section>
  );
}

function ConstructionProgressPanel({
  activeConstruction,
}: {
  activeConstruction: KingdomDashboardData["activeConstruction"];
}) {
  return (
    <Section title="Construction progress">
      {activeConstruction.length > 0 ? (
        <TableCard minWidth="min-w-[680px]">
          <thead>
            <tr>
              <th>Building</th>
              <th>Level</th>
              <th>District</th>
              <th>Status</th>
              <th>Remaining ticks</th>
              <th>Estimated time</th>
            </tr>
          </thead>
          <tbody>
            {activeConstruction.map((building) => (
              <tr key={building.id}>
                <td className="font-medium text-[#10140f]">{building.label}</td>
                <td className="text-[#5f665d]">{building.level}</td>
                <td className="text-[#5f665d]">{building.districtLabel}</td>
                <td className="text-[#5f665d]">{building.statusLabel}</td>
                <td className="text-[#5f665d]">{formatTicks(building.remainingTicks)}</td>
                <td className="text-[#5f665d]">{building.estimatedTimeRemaining}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">
          No construction or upgrades are active.
        </p>
      )}
    </Section>
  );
}

function TrainingProgressPanel({
  trainingQueues,
}: {
  trainingQueues: KingdomDashboardData["trainingQueues"];
}) {
  return (
    <Section title="Training progress">
      {trainingQueues.length > 0 ? (
        <TableCard minWidth="min-w-[640px]">
          <thead>
            <tr>
              <th>Unit</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Remaining ticks</th>
              <th>Estimated time</th>
            </tr>
          </thead>
          <tbody>
            {trainingQueues.map((queue) => (
              <tr key={queue.id}>
                <td className="font-medium text-[#10140f]">{queue.label}</td>
                <td className="text-[#5f665d]">{formatNumber(queue.quantity)}</td>
                <td className="text-[#5f665d]">{queue.statusLabel}</td>
                <td className="text-[#5f665d]">{formatTicks(queue.remainingTicks)}</td>
                <td className="text-[#5f665d]">{queue.estimatedTimeRemaining}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">
          No unit training is active.
        </p>
      )}
    </Section>
  );
}

function ArmyPanel({ army }: { army: KingdomDashboardData["army"] }) {
  return (
    <Section title="Army">
      {army.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {army.map((unitStack) => (
            <SummaryCard
              detail={unitStack.locationLabel}
              key={unitStack.id}
              label={unitStack.label}
              value={formatNumber(unitStack.quantity)}
            />
          ))}
        </div>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">No garrisoned units exist yet.</p>
      )}
    </Section>
  );
}

function LatestTickPanel({ ticks }: { ticks: KingdomDashboardData["latestTicks"] }) {
  return (
    <Section title="Latest tick activity">
      {ticks.length > 0 ? (
        <TableCard minWidth="min-w-[860px]">
          <thead>
            <tr>
              <th>Tick key</th>
              <th>Status</th>
              <th>Kingdoms</th>
              <th>Started</th>
              <th>Finished</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {ticks.map((tick) => (
              <tr key={tick.tickKey}>
                <td className="break-all font-medium text-[#10140f]">{tick.tickKey}</td>
                <td className="text-[#5f665d]">{tick.statusLabel}</td>
                <td className="text-[#5f665d]">{formatNumber(tick.processedKingdomCount)}</td>
                <td className="text-[#5f665d]">{formatDateTime(tick.startedAt)}</td>
                <td className="text-[#5f665d]">{formatOptionalDateTime(tick.finishedAt)}</td>
                <td className="text-[#9f3030]">
                  {tick.status === "FAILED" ? tick.errorMessage ?? "Tick failed" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">No ticks have been logged yet.</p>
      )}
    </Section>
  );
}

function ReportsPanel({ reports }: { reports: KingdomDashboardData["reports"] }) {
  return (
    <Section title="Latest kingdom reports">
      {reports.length > 0 ? (
        <TableCard minWidth="min-w-[820px]">
          <thead>
            <tr>
              <th>Type</th>
              <th>Title</th>
              <th>Summary</th>
              <th>Created</th>
              <th>State</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr key={report.id}>
                <td className="font-medium text-[#10140f]">{report.typeLabel}</td>
                <td className="text-[#5f665d]">{report.title}</td>
                <td className="text-[#5f665d]">{report.bodySummary ?? "No summary"}</td>
                <td className="text-[#5f665d]">{formatDateTime(report.createdAt)}</td>
                <td className="text-[#5f665d]">{report.read ? "Read" : "Unread"}</td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      ) : (
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">No reports yet.</p>
      )}
    </Section>
  );
}

export default async function DashboardPage() {
  const user = await requireUserWithKingdom();
  const dashboardData = await getKingdomDashboardData(user.kingdom.id);
  const userIsAdmin = isAdminUser(user);

  if (!dashboardData) {
    redirect("/create-kingdom");
  }

  return (
    <main className="mamalik-page">
      <div className="mamalik-container space-y-7">
        <header className="mamalik-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="mamalik-eyebrow">Kingdom command</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10140f]">
              {dashboardData.kingdom.name}
            </h1>
            <p className="mt-2 text-sm text-[#5f665d]">
              @{dashboardData.kingdom.slug}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {userIsAdmin ? (
              <Link
                className="mamalik-action-secondary px-4 py-2"
                href="/admin"
              >
                Admin panel
              </Link>
            ) : null}
            <Link className="mamalik-action-secondary px-4 py-2" href="/">
              Home
            </Link>
            <form action="/api/auth/logout" method="post">
              <button
                className="mamalik-action-secondary px-4 py-2"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        <section className="rounded-md border border-[#cbd8cd] bg-[#eff6ed] px-4 py-3 text-sm text-[#183f35]">
          {DASHBOARD_STATUS_NOTE}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
            detail={`Used ${formatLand(dashboardData.kingdom.usedLandM2)}`}
            label="Usable land"
            value={formatLand(dashboardData.kingdom.usableLandM2)}
          />
          <SummaryCard
            detail={`Visible area estimate ${formatLand(dashboardData.kingdom.visibleAreaM2)}`}
            label="Free land"
            value={formatLand(dashboardData.kingdom.freeLandM2)}
          />
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <SummaryCard
            label="Population"
            value={formatNumber(dashboardData.kingdom.population)}
          />
          <SummaryCard label="Account" value={user.displayName} detail={user.email} />
        </section>

        <ResourcePanel resources={dashboardData.resources} />
        <EconomyPanel economyEstimate={dashboardData.economyEstimate} />
        <FoodStatusPanel foodStatus={dashboardData.foodStatus} />

        <section className="grid gap-7 xl:grid-cols-2">
          <ConstructionProgressPanel activeConstruction={dashboardData.activeConstruction} />
          <TrainingProgressPanel trainingQueues={dashboardData.trainingQueues} />
        </section>

        <DistrictPanel districts={dashboardData.districts} />
        <BuildingPanel buildings={dashboardData.buildings} />
        <ArmyPanel army={dashboardData.army} />
        <LatestTickPanel ticks={dashboardData.latestTicks} />
        <ReportsPanel reports={dashboardData.reports} />

        <div>
          <Link
            className="font-semibold text-[#183f35] underline"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
