import type { ReactNode } from "react";
import { DistrictLandAllocationPanel } from "@/components/kingdom/DistrictLandAllocationPanel";
import { LandPurchasePanel } from "@/components/kingdom/LandPurchasePanel";
import type {
  FoodStatusLevel,
  KingdomDashboardData,
} from "@/lib/kingdom/dashboard-data";

const numberFormatter = new Intl.NumberFormat("en-US");
const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: "UTC",
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatSignedNumber(value: number): string {
  return value > 0 ? `+${formatNumber(value)}` : formatNumber(value);
}

export function formatLand(value: number): string {
  return `${formatNumber(value)} m²`;
}

export function formatDateTime(value: Date): string {
  return `${dateFormatter.format(value)} UTC`;
}

export function formatTicks(value: number): string {
  return `${formatNumber(value)} tick${value === 1 ? "" : "s"}`;
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
    <section className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold text-mk-ink">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Ledger({ children }: { children: ReactNode }) {
  return (
    <div className="mamalik-card overflow-x-auto">
      <table className="mamalik-table">{children}</table>
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p className="mamalik-card px-4 py-5 text-sm text-mk-muted">{children}</p>
  );
}

export function SignedValue({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-mk-faint">0</span>;
  }

  return (
    <span className={value < 0 ? "text-mk-danger" : "text-mk-success"}>
      {formatSignedNumber(value)}
    </span>
  );
}

function UsageBar({ percentage }: { percentage: number }) {
  const width = Math.max(0, Math.min(100, percentage));

  return (
    <div className="h-1 w-full min-w-16 bg-mk-sunken">
      <div className="h-full bg-mk-ink" style={{ width: `${width}%` }} />
    </div>
  );
}

export function EconomyPanel({
  economyEstimate,
}: {
  economyEstimate: KingdomDashboardData["economyEstimate"];
}) {
  const groups: Array<{ title: string; total: number; lines: Array<[string, number]> }> = [
    {
      title: "Money",
      total: economyEstimate.money.total,
      lines: [
        ["Taxes", economyEstimate.money.populationTax],
        ["Markets", economyEstimate.money.marketBonus],
        ["Tax Offices", economyEstimate.money.taxOfficeBonus],
        ["Palace", economyEstimate.money.palaceBonus],
      ],
    },
    {
      title: "Food",
      total: economyEstimate.food.net,
      lines: [
        ["Farms", economyEstimate.food.farmProduction],
        ["Population", -economyEstimate.food.populationConsumption],
        ["Army", -economyEstimate.food.armyConsumption],
      ],
    },
    {
      title: "Manpower",
      total: economyEstimate.manpower.total,
      lines: [
        ["Population", economyEstimate.manpower.populationManpowerGrowth],
        ["Houses", economyEstimate.manpower.housesBonus],
      ],
    },
    {
      title: "Knowledge",
      total: economyEstimate.knowledge.total,
      lines: [["Scholar Halls", economyEstimate.knowledge.scholarHallProduction]],
    },
  ];

  return (
    <Section title="Per tick (every 10 minutes)">
      <Ledger>
        <thead>
          <tr>
            <th>Resource</th>
            <th>Source</th>
            <th className="num">Per tick</th>
          </tr>
        </thead>
        <tbody>
          {groups.flatMap((group) => [
            ...group.lines.map(([label, value], index) => (
              <tr key={`${group.title}-${label}`}>
                <td className="text-mk-muted">{index === 0 ? group.title : ""}</td>
                <td className="text-mk-muted">{label}</td>
                <td className="num">
                  <SignedValue value={value} />
                </td>
              </tr>
            )),
            <tr className="subtotal" key={`${group.title}-total`}>
              <td>{group.title}</td>
              <td>Total</td>
              <td className="num">
                <SignedValue value={group.total} />
              </td>
            </tr>,
          ])}
        </tbody>
      </Ledger>
    </Section>
  );
}

function getFoodStatusClass(level: FoodStatusLevel): string {
  switch (level) {
    case "shortage":
      return "text-mk-danger";
    case "warning":
      return "text-mk-warn";
    case "healthy":
      return "text-mk-muted";
  }
}

export function FoodStatusPanel({
  foodStatus,
}: {
  foodStatus: KingdomDashboardData["foodStatus"];
}) {
  return (
    <p className={`mamalik-card px-4 py-3 text-sm ${getFoodStatusClass(foodStatus.level)}`}>
      <span className="font-semibold">Food {foodStatus.label.toLowerCase()}.</span> {foodStatus.detail}
    </p>
  );
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
    <Section title="Districts">
      <Ledger>
        <thead>
          <tr>
            <th>District</th>
            <th className="num">Buildings</th>
            <th className="num">Used</th>
            <th className="num">Size</th>
            <th className="w-1/4">Usage</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr key={district.id}>
              <td className="font-medium">{district.label}</td>
              <td className="num text-mk-muted">{formatNumber(district.buildingCount)}</td>
              <td className="num text-mk-muted">{formatLand(district.usedLandM2)}</td>
              <td className="num">{formatLand(district.allocatedLandM2)}</td>
              <td>
                <div className="flex items-center gap-2">
                  <UsageBar percentage={district.usagePercentage} />
                  <span className="w-9 text-right text-xs tabular-nums text-mk-muted">
                    {district.usagePercentage}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Ledger>
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
  if (buildings.length === 0) {
    return <EmptyState>No buildings yet.</EmptyState>;
  }

  return (
    <Ledger>
      <thead>
        <tr>
          <th>Building</th>
          <th>District</th>
          <th className="num">Level</th>
          <th className="num">Status</th>
        </tr>
      </thead>
      <tbody>
        {buildings.map((building) => (
          <tr key={building.id}>
            <td className="font-medium">{building.label}</td>
            <td className="text-mk-muted">{building.districtLabel}</td>
            <td className="num">{building.level}</td>
            <td className="num text-mk-muted">
              {building.status === "ACTIVE" ? (
                "Active"
              ) : (
                <span className="text-mk-warn">
                  {building.statusLabel}, {formatTicks(building.constructionRemainingTicks)}
                </span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Ledger>
  );
}

export function ConstructionProgressPanel({
  activeConstruction,
}: {
  activeConstruction: KingdomDashboardData["activeConstruction"];
}) {
  return (
    <Section title="Under construction">
      <Ledger>
        <tbody>
          {activeConstruction.map((building) => (
            <tr key={building.id}>
              <td className="font-medium">
                {building.label} <span className="font-normal text-mk-muted">to level {building.level}</span>
              </td>
              <td className="num text-mk-warn">{building.estimatedTimeRemaining}</td>
            </tr>
          ))}
        </tbody>
      </Ledger>
    </Section>
  );
}

export function TrainingProgressPanel({
  trainingQueues,
}: {
  trainingQueues: KingdomDashboardData["trainingQueues"];
}) {
  return (
    <Section title="In training">
      <Ledger>
        <tbody>
          {trainingQueues.map((queue) => (
            <tr key={queue.id}>
              <td className="font-medium">
                {formatNumber(queue.quantity)} {queue.label}
              </td>
              <td className="num text-mk-warn">{queue.estimatedTimeRemaining}</td>
            </tr>
          ))}
        </tbody>
      </Ledger>
    </Section>
  );
}

export function ArmyPanel({ army }: { army: KingdomDashboardData["army"] }) {
  if (army.length === 0) {
    return <EmptyState>Your garrison is empty.</EmptyState>;
  }

  const total = army.reduce((sum, unitStack) => sum + unitStack.quantity, 0);

  return (
    <Ledger>
      <thead>
        <tr>
          <th>Unit</th>
          <th>Location</th>
          <th className="num">Count</th>
        </tr>
      </thead>
      <tbody>
        {army.map((unitStack) => (
          <tr key={unitStack.id}>
            <td className="font-medium">{unitStack.label}</td>
            <td className="text-mk-muted">{unitStack.locationLabel}</td>
            <td className="num">{formatNumber(unitStack.quantity)}</td>
          </tr>
        ))}
        <tr className="subtotal">
          <td>Total</td>
          <td />
          <td className="num">{formatNumber(total)}</td>
        </tr>
      </tbody>
    </Ledger>
  );
}

export function ReportList({
  reports,
}: {
  reports: KingdomDashboardData["reports"];
}) {
  if (reports.length === 0) {
    return <EmptyState>No activity yet.</EmptyState>;
  }

  return (
    <Ledger>
      <tbody>
        {reports.map((report) => (
          <tr key={report.id}>
            <td className="w-32 whitespace-nowrap align-top text-xs tabular-nums text-mk-muted">
              {formatDateTime(report.createdAt)}
            </td>
            <td>
              <span className={report.read ? "text-mk-ink" : "font-semibold text-mk-ink"}>
                {report.bodySummary ?? report.title}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Ledger>
  );
}
