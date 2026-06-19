import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithKingdom } from "@/lib/auth/guards";
import { isAdminUser } from "@/lib/auth/route-destinations";
import {
  DASHBOARD_STATUS_NOTE,
  getKingdomDashboardData,
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

function formatLand(value: number): string {
  return `${formatNumber(value)} m2`;
}

function formatCoordinate(value: number): string {
  return coordinateFormatter.format(value);
}

function formatDateTime(value: Date): string {
  return `${dateFormatter.format(value)} UTC`;
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
    <section className="mamalik-card p-5">
      <h2 className="text-lg font-semibold text-[#10140f]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function ResourcePanel({ resources }: { resources: KingdomDashboardData["resources"] }) {
  return (
    <Section title="Resources">
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Money" value={formatNumber(resources.money)} />
        <SummaryCard label="Food" value={formatNumber(resources.food)} />
        <SummaryCard label="Manpower" value={formatNumber(resources.manpower)} />
        <SummaryCard label="Knowledge" value={formatNumber(resources.knowledge)} />
      </dl>
    </Section>
  );
}

function DistrictPanel({ districts }: { districts: KingdomDashboardData["districts"] }) {
  return (
    <Section title="Districts">
      <div className="overflow-x-auto">
        <table className="mamalik-table min-w-[560px] text-sm">
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
                <td className="text-[#5f665d]">
                  {formatLand(district.allocatedLandM2)}
                </td>
                <td className="text-[#5f665d]">{formatLand(district.usedLandM2)}</td>
                <td className="text-[#5f665d]">{formatLand(district.freeLandM2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

function BuildingPanel({ buildings }: { buildings: KingdomDashboardData["buildings"] }) {
  return (
    <Section title="Buildings">
      {buildings.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="mamalik-table min-w-[680px] text-sm">
            <thead>
              <tr>
                <th>Building</th>
                <th>Level</th>
                <th>Status</th>
                <th>Land</th>
                <th>District</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-[#5f665d]">No buildings exist yet.</p>
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
        <p className="text-sm text-[#5f665d]">No garrisoned units exist yet.</p>
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
      <div className="mamalik-container space-y-6">
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
        <DistrictPanel districts={dashboardData.districts} />
        <BuildingPanel buildings={dashboardData.buildings} />
        <ArmyPanel army={dashboardData.army} />

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
