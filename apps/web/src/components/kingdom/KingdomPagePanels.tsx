import type { ReactNode } from "react";
import { DistrictLandAllocationPanel } from "@/components/kingdom/DistrictLandAllocationPanel";
import { LandPurchasePanel } from "@/components/kingdom/LandPurchasePanel";
import { describeFoodStatus, describeReport, districtName, formatArea, formatSigned, formatTickDuration, unitName, buildingName } from "@/i18n/game-text";
import { fill, formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import type { FoodStatusLevel, KingdomDashboardData } from "@/lib/kingdom/dashboard-data";

const dateFormatters = {
  en: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }),
  ar: new Intl.DateTimeFormat("ar-EG-u-nu-latn", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }),
};

export function formatDateTime(value: Date, locale: "en" | "ar" = "en"): string {
  return `${dateFormatters[locale].format(value)} UTC`;
}

export function Section({ action, children, title }: { action?: ReactNode; children: ReactNode; title: string }) {
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
  return <p className="mamalik-card px-4 py-5 text-sm text-mk-muted">{children}</p>;
}

export function SignedValue({ value }: { value: number }) {
  if (value === 0) {
    return <span className="text-mk-faint">0</span>;
  }

  return (
    <span className={value < 0 ? "text-mk-danger" : "text-mk-success"} dir="ltr">
      {formatSigned(value)}
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

export async function EconomyPanel({ economyEstimate }: { economyEstimate: KingdomDashboardData["economyEstimate"] }) {
  const { m } = await getI18n();
  const sources = m.economy.sources;
  const groups: Array<{ title: string; total: number; lines: Array<[string, number]> }> = [
    {
      title: m.resources.money,
      total: economyEstimate.money.total,
      lines: [
        [sources.taxes, economyEstimate.money.populationTax],
        [sources.markets, economyEstimate.money.marketBonus],
        [sources.taxOffices, economyEstimate.money.taxOfficeBonus],
        [sources.palace, economyEstimate.money.palaceBonus],
      ],
    },
    {
      title: m.resources.food,
      total: economyEstimate.food.net,
      lines: [
        [sources.farms, economyEstimate.food.farmProduction],
        [sources.population, -economyEstimate.food.populationConsumption],
        [sources.army, -economyEstimate.food.armyConsumption],
      ],
    },
    {
      title: m.resources.manpower,
      total: economyEstimate.manpower.total,
      lines: [
        [sources.population, economyEstimate.manpower.populationManpowerGrowth],
        [sources.houses, economyEstimate.manpower.housesBonus],
      ],
    },
    {
      title: m.resources.knowledge,
      total: economyEstimate.knowledge.total,
      lines: [[sources.scholarHalls, economyEstimate.knowledge.scholarHallProduction]],
    },
  ];

  return (
    <Section title={m.economy.perTick}>
      <Ledger>
        <thead>
          <tr>
            <th>{m.economy.resource}</th>
            <th>{m.economy.source}</th>
            <th className="num">{m.economy.perTickColumn}</th>
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
              <td>{m.common.total}</td>
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

export async function FoodStatusPanel({ data }: { data: KingdomDashboardData }) {
  const text = await getI18n();
  const copy = describeFoodStatus(text, data.foodStatus, data.economyEstimate.food.net);

  return (
    <p className={`mamalik-card px-4 py-3 text-sm ${getFoodStatusClass(data.foodStatus.level)}`}>
      <span className="font-semibold">{copy.label}</span> {copy.detail}
    </p>
  );
}

export async function DistrictPanel({
  districts,
  landTotals,
  showAllocationForm = true,
}: {
  districts: KingdomDashboardData["districts"];
  landTotals: KingdomDashboardData["landTotals"];
  showAllocationForm?: boolean;
}) {
  const text = await getI18n();
  const { m } = text;

  return (
    <Section title={m.land.districts}>
      <Ledger>
        <thead>
          <tr>
            <th>{m.land.district}</th>
            <th className="num">{m.land.buildingCount}</th>
            <th className="num">{m.land.used}</th>
            <th className="num">{m.land.size}</th>
            <th className="w-1/4">{m.land.usage}</th>
          </tr>
        </thead>
        <tbody>
          {districts.map((district) => (
            <tr key={district.id}>
              <td className="font-medium">{districtName(text, district.type)}</td>
              <td className="num text-mk-muted">{formatNumber(district.buildingCount)}</td>
              <td className="num text-mk-muted">{formatArea(text, district.usedLandM2)}</td>
              <td className="num">{formatArea(text, district.allocatedLandM2)}</td>
              <td>
                <div className="flex items-center gap-2">
                  <UsageBar percentage={district.usagePercentage} />
                  <span className="w-9 text-end text-xs tabular-nums text-mk-muted">{district.usagePercentage}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </Ledger>
      {showAllocationForm ? (
        <DistrictLandAllocationPanel
          districts={districts.map((district) => ({
            id: district.id,
            type: district.type,
            freeLandM2: district.freeLandM2,
          }))}
          unallocatedLandM2={landTotals.unallocatedUsableLandM2}
        />
      ) : null}
    </Section>
  );
}

export async function LandPurchaseSection({ options }: { options: KingdomDashboardData["landPurchaseOptions"] }) {
  const { m } = await getI18n();

  return (
    <Section title={m.land.buyTitle}>
      <LandPurchasePanel options={options} />
    </Section>
  );
}

export async function ConstructionProgressPanel({ activeConstruction }: { activeConstruction: KingdomDashboardData["activeConstruction"] }) {
  const text = await getI18n();

  return (
    <Section title={text.m.buildingsPage.underConstruction}>
      <Ledger>
        <tbody>
          {activeConstruction.map((building) => (
            <tr key={building.id}>
              <td className="font-medium">
                {buildingName(text, building.type)}{" "}
                <span className="font-normal text-mk-muted">{fill(text.m.buildingsPage.toLevel, { level: building.level })}</span>
              </td>
              <td className="num text-mk-warn">{formatTickDuration(text, building.remainingTicks)}</td>
            </tr>
          ))}
        </tbody>
      </Ledger>
    </Section>
  );
}

export async function TrainingProgressPanel({ trainingQueues }: { trainingQueues: KingdomDashboardData["trainingQueues"] }) {
  const text = await getI18n();

  return (
    <Section title={text.m.armyPage.inTraining}>
      <Ledger>
        <tbody>
          {trainingQueues.map((queue) => (
            <tr key={queue.id}>
              <td className="font-medium">
                {formatNumber(queue.quantity)} {unitName(text, queue.unitType)}
              </td>
              <td className="num text-mk-warn">{formatTickDuration(text, queue.remainingTicks)}</td>
            </tr>
          ))}
        </tbody>
      </Ledger>
    </Section>
  );
}

export async function ArmyPanel({ army }: { army: KingdomDashboardData["army"] }) {
  const text = await getI18n();
  const { m } = text;

  if (army.length === 0) {
    return <EmptyState>{m.armyPage.empty}</EmptyState>;
  }

  const total = army.reduce((sum, unitStack) => sum + unitStack.quantity, 0);
  const locations = m.armyPage.locations as Record<string, string>;

  return (
    <Ledger>
      <thead>
        <tr>
          <th>{m.armyPage.unit}</th>
          <th>{m.armyPage.location}</th>
          <th className="num">{m.armyPage.count}</th>
        </tr>
      </thead>
      <tbody>
        {army.map((unitStack) => (
          <tr key={unitStack.id}>
            <td className="font-medium">{unitName(text, unitStack.unitType)}</td>
            <td className="text-mk-muted">{locations[unitStack.locationType] ?? unitStack.locationType}</td>
            <td className="num">{formatNumber(unitStack.quantity)}</td>
          </tr>
        ))}
        <tr className="subtotal">
          <td>{m.common.total}</td>
          <td />
          <td className="num">{formatNumber(total)}</td>
        </tr>
      </tbody>
    </Ledger>
  );
}

export async function ReportList({ reports }: { reports: KingdomDashboardData["reports"] }) {
  const text = await getI18n();

  if (reports.length === 0) {
    return <EmptyState>{text.m.reports.empty}</EmptyState>;
  }

  return (
    <Ledger>
      <tbody>
        {reports.map((report) => (
          <tr key={report.id}>
            <td className="w-36 whitespace-nowrap align-top text-xs tabular-nums text-mk-muted">
              {formatDateTime(report.createdAt, text.locale)}
            </td>
            <td>
              <span className={report.read ? "text-mk-ink" : "font-semibold text-mk-ink"}>
                {describeReport(text, report.type, report.title, report.body)}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </Ledger>
  );
}
