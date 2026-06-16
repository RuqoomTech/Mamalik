import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUserWithKingdom } from "@/lib/auth/guards";
import {
  DASHBOARD_STATUS_NOTE,
  getKingdomDashboardData,
  type KingdomDashboardData,
} from "@/lib/kingdom/dashboard-data";

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
    <div className="rounded-md border border-neutral-200 bg-white p-4">
      <p className="text-sm text-neutral-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-neutral-950">{value}</p>
      {detail ? <p className="mt-1 text-sm text-neutral-600">{detail}</p> : null}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-semibold text-neutral-950">{title}</h2>
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
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="border-b border-neutral-200 text-neutral-500">
            <tr>
              <th className="py-2 pr-4 font-medium">District</th>
              <th className="px-4 py-2 font-medium">Allocated</th>
              <th className="px-4 py-2 font-medium">Used</th>
              <th className="py-2 pl-4 font-medium">Free</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {districts.map((district) => (
              <tr key={district.id}>
                <td className="py-3 pr-4 font-medium text-neutral-950">{district.label}</td>
                <td className="px-4 py-3 text-neutral-700">
                  {formatLand(district.allocatedLandM2)}
                </td>
                <td className="px-4 py-3 text-neutral-700">{formatLand(district.usedLandM2)}</td>
                <td className="py-3 pl-4 text-neutral-700">{formatLand(district.freeLandM2)}</td>
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
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-neutral-200 text-neutral-500">
              <tr>
                <th className="py-2 pr-4 font-medium">Building</th>
                <th className="px-4 py-2 font-medium">Level</th>
                <th className="px-4 py-2 font-medium">Status</th>
                <th className="px-4 py-2 font-medium">Land</th>
                <th className="py-2 pl-4 font-medium">District</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {buildings.map((building) => (
                <tr key={building.id}>
                  <td className="py-3 pr-4 font-medium text-neutral-950">{building.label}</td>
                  <td className="px-4 py-3 text-neutral-700">{building.level}</td>
                  <td className="px-4 py-3 text-neutral-700">{building.statusLabel}</td>
                  <td className="px-4 py-3 text-neutral-700">
                    {formatLand(building.landUsedM2)}
                  </td>
                  <td className="py-3 pl-4 text-neutral-700">{building.districtLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-neutral-600">No buildings exist yet.</p>
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
        <p className="text-sm text-neutral-600">No garrisoned units exist yet.</p>
      )}
    </Section>
  );
}

export default async function DashboardPage() {
  const user = await requireUserWithKingdom();
  const dashboardData = await getKingdomDashboardData(user.kingdom.id);

  if (!dashboardData) {
    redirect("/create-kingdom");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-8">
      <div className="space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-neutral-500">
              Mamalik
            </p>
            <h1 className="text-3xl font-semibold text-neutral-950">
              {dashboardData.kingdom.name}
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              @{dashboardData.kingdom.slug}
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button
              className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-neutral-100"
              type="submit"
            >
              Log out
            </button>
          </form>
        </header>

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

        <section className="rounded-md border border-neutral-200 bg-neutral-50 p-5">
          <h2 className="text-lg font-semibold text-neutral-950">Sprint 1 Status</h2>
          <p className="mt-2 text-sm text-neutral-700">{DASHBOARD_STATUS_NOTE}</p>
        </section>

        <div>
          <Link
            className="text-sm font-medium text-neutral-950 underline"
            href="/"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
