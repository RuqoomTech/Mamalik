import type { ReactNode } from "react";
import { DistrictLandAllocationPanel } from "@/components/kingdom/DistrictLandAllocationPanel";
import { LandPurchasePanel } from "@/components/kingdom/LandPurchasePanel";
import type {
  FoodStatusLevel,
  KingdomDashboardData,
} from "@/lib/kingdom/dashboard-data";

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

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatSignedNumber(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export function formatLand(value: number): string {
  return `${formatNumber(value)} m2`;
}

export function formatCoordinate(value: number): string {
  return coordinateFormatter.format(value);
}

export function formatDateTime(value: Date): string {
  return `${dateFormatter.format(value)} UTC`;
}

export function formatOptionalDateTime(value: Date | null): string {
  return value ? formatDateTime(value) : "Not finished";
}

export function formatTicks(value: number): string {
  return `${formatNumber(value)} tick${value === 1 ? "" : "s"}`;
}

export function SummaryCard({
  detail,
  label,
  value,
}: {
  detail?: string;
  label: string;
  value: string;
}) {
  return (
    <div className="mamalik-card p-4">
      <p className="text-sm text-[#5f665d]">{label}</p>
      <p className="mt-1 text-xl font-semibold text-[#10140f]">{value}</p>
      {detail ? <p className="mt-1 text-sm text-[#5f665d]">{detail}</p> : null}
    </div>
  );
}

export function Section({
  action,
  children,
  title,
}: {
  action?: ReactNode;
  children: ReactNode;
  title: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#10140f]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TableCard({
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

export function ResourcePanel({
  compact = false,
  resources,
}: {
  compact?: boolean;
  resources: KingdomDashboardData["resources"];
}) {
  return (
    <Section title="Resource stockpiles">
      <dl className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-4"}`}>
        <SummaryCard label="Money" value={formatNumber(resources.money)} />
        <SummaryCard label="Food" value={formatNumber(resources.food)} />
        <SummaryCard label="Manpower" value={formatNumber(resources.manpower)} />
        <SummaryCard label="Knowledge" value={formatNumber(resources.knowledge)} />
      </dl>
    </Section>
  );
}

export function EconomyPanel({
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

export function FoodStatusPanel({
  foodStatus,
}: {
  foodStatus: KingdomDashboardData["foodStatus"];
}) {
  return (
    <Section title="Food status">
      <div className={`rounded-md border px-4 py-3 ${getFoodStatusClass(foodStatus.level)}`}>
        <p className="font-semibold">{foodStatus.label}</p>
        <p className="mt-1 text-sm">{foodStatus.detail}</p>
      </div>
    </Section>
  );
}

function getDistrictLandStatusClass(
  status: KingdomDashboardData["districts"][number]["status"],
): string {
  switch (status) {
    case "full":
      return "border-[#e1b8b8] bg-[#fff0f0] text-[#7a1d1d]";
    case "nearly-full":
      return "border-[#e7d6a0] bg-[#fff9e7] text-[#6a4a0a]";
    case "healthy":
      return "border-[#cbd8cd] bg-[#eff6ed] text-[#183f35]";
  }
}

export function DistrictPanel({
  districts,
  landTotals,
  showAllocationForm = true,
}: {
  districts: KingdomDashboardData["districts"];
  landTotals: KingdomDashboardData["landTotals"];
  showAllocationForm?: boolean;
}) {
  return (
    <Section title="District land">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Usable land" value={formatLand(landTotals.totalUsableLandM2)} />
        <SummaryCard
          label="Allocated"
          value={formatLand(landTotals.totalDistrictAllocatedLandM2)}
        />
        <SummaryCard
          label="Used by districts"
          value={formatLand(landTotals.totalDistrictUsedLandM2)}
        />
        <SummaryCard
          label="Free inside districts"
          value={formatLand(landTotals.totalDistrictFreeLandM2)}
        />
        <SummaryCard
          label="Unallocated"
          value={formatLand(landTotals.unallocatedUsableLandM2)}
        />
      </div>
      <TableCard minWidth="min-w-[840px]">
        <thead>
          <tr>
            <th>District</th>
            <th>Allocated</th>
            <th>Used</th>
            <th>Free</th>
            <th>Usage</th>
            <th>Buildings</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr key={district.id}>
              <td className="font-medium text-[#10140f]">{district.label}</td>
              <td className="text-[#5f665d]">{formatLand(district.allocatedLandM2)}</td>
              <td className="text-[#5f665d]">{formatLand(district.usedLandM2)}</td>
              <td className="text-[#5f665d]">{formatLand(district.freeLandM2)}</td>
              <td className="text-[#5f665d]">
                <div className="flex min-w-[150px] items-center gap-3">
                  <div className="h-2 w-24 rounded-full bg-[#e8ece6]">
                    <div
                      className="h-2 rounded-full bg-[#183f35]"
                      style={{ width: `${district.usagePercentage}%` }}
                    />
                  </div>
                  <span>{district.usagePercentage}%</span>
                </div>
              </td>
              <td className="text-[#5f665d]">{formatNumber(district.buildingCount)}</td>
              <td>
                <span
                  className={`inline-flex rounded-full border px-2 py-1 text-xs font-semibold ${getDistrictLandStatusClass(
                    district.status,
                  )}`}
                >
                  {district.statusLabel}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </TableCard>
      {showAllocationForm ? (
        <DistrictLandAllocationPanel
          districts={districts.map((district) => ({
            allocatedLandM2: district.allocatedLandM2,
            freeLandM2: district.freeLandM2,
            id: district.id,
            label: district.label,
            statusLabel: district.statusLabel,
          }))}
          unallocatedLandM2={landTotals.unallocatedUsableLandM2}
        />
      ) : null}
    </Section>
  );
}

export function LandPurchaseSection({
  options,
}: {
  options: KingdomDashboardData["landPurchaseOptions"];
}) {
  return (
    <Section title="Buy land">
      <LandPurchasePanel options={options} />
    </Section>
  );
}

export function BuildingPanel({
  buildings,
}: {
  buildings: KingdomDashboardData["buildings"];
}) {
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

export function ConstructionProgressPanel({
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

export function TrainingProgressPanel({
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

export function ArmyPanel({ army }: { army: KingdomDashboardData["army"] }) {
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
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">
          No garrisoned units exist yet.
        </p>
      )}
    </Section>
  );
}

export function LatestTickPanel({
  ticks,
}: {
  ticks: KingdomDashboardData["latestTicks"];
}) {
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
        <p className="mamalik-card p-4 text-sm text-[#5f665d]">
          No ticks have been logged yet.
        </p>
      )}
    </Section>
  );
}

export function ReportsPanel({
  reports,
}: {
  reports: KingdomDashboardData["reports"];
}) {
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
