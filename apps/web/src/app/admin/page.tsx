import { Children, type ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/guards";
import {
  ADMIN_DETAIL_TABLE_LIMIT,
  ADMIN_REPORT_PREVIEW_LIMIT,
  ADMIN_TABLE_LIMIT,
  getAdminOverviewData,
} from "@/lib/admin/admin-data";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

const numberFormatter = new Intl.NumberFormat("en");

function formatDate(value: Date): string {
  return `${dateFormatter.format(value)} UTC`;
}

function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

function formatNullableNumber(value: number | null): string {
  return value === null ? "Missing" : formatNumber(value);
}

function formatLand(value: number): string {
  return `${formatNumber(value)} m2`;
}

function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function AdminSection({
  title,
  limitLabel,
  children,
}: {
  title: string;
  limitLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="mamalik-card space-y-3 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold text-[#10140f]">{title}</h2>
        {limitLabel ? <p className="text-xs text-[#5f665d]">{limitLabel}</p> : null}
      </div>
      {children}
    </section>
  );
}

function AdminTable({
  headers,
  emptyMessage,
  children,
}: {
  headers: string[];
  emptyMessage: string;
  children: ReactNode;
}) {
  const hasRows = Children.count(children) > 0;

  return (
    <div className="overflow-x-auto rounded-md border border-[#dfe5dc]">
      <table className="mamalik-table min-w-full text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                className="whitespace-nowrap"
                key={header}
                scope="col"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {hasRows ? (
            children
          ) : (
            <tr>
              <td className="px-3 py-4 text-[#5f665d]" colSpan={headers.length}>
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[#dfe5dc] bg-[#f7f8f4] p-4">
      <p className="mamalik-eyebrow">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#10140f]">
        {formatNumber(value)}
      </p>
    </div>
  );
}

export default async function AdminPage() {
  const user = await requireAdmin();
  const data = await getAdminOverviewData();

  return (
    <main className="mamalik-page">
      <div className="mamalik-container flex flex-col gap-6">
        <header className="mamalik-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="mamalik-eyebrow">Mamalik</p>
            <h1 className="mt-1 text-3xl font-semibold text-[#10140f]">
              Admin Panel
            </h1>
            <p className="mt-2 text-sm text-[#5f665d]">
              Signed in as {user.displayName} ({user.email})
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="mamalik-action-secondary px-4 py-2"
              href="/dashboard"
            >
              Dashboard
            </Link>
            <Link
              className="mamalik-action-secondary px-4 py-2"
              href="/"
            >
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

        <AdminSection title="Admin Overview">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Users" value={data.counts.users} />
            <StatCard label="Kingdoms" value={data.counts.kingdoms} />
            <StatCard label="Reports" value={data.counts.reports} />
          </div>
        </AdminSection>

        <AdminSection title="Users" limitLabel={`Latest ${ADMIN_TABLE_LIMIT}`}>
          <AdminTable
            emptyMessage="No users found."
            headers={[
              "Email",
              "Display name",
              "Role",
              "Auth provider",
              "Created",
              "Kingdom",
            ]}
          >
            {data.users.map((row) => (
              <tr key={row.email}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.email}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.displayName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.roleLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.authProviderLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatDate(row.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.hasKingdom ? "Yes" : "No"}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <AdminSection title="Kingdoms" limitLabel={`Latest ${ADMIN_TABLE_LIMIT}`}>
          <AdminTable
            emptyMessage="No kingdoms found."
            headers={[
              "Name",
              "Slug",
              "Owner",
              "Center",
              "Usable land",
              "Used land",
              "Population",
              "Protection ends",
              "Created",
            ]}
          >
            {data.kingdoms.map((row) => (
              <tr key={row.slug}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.name}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.slug}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.ownerDisplayName} ({row.ownerEmail})
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatCoordinates(row.centerLat, row.centerLng)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatLand(row.usableLandM2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatLand(row.usedLandM2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatNumber(row.population)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatDate(row.protectionEndsAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatDate(row.createdAt)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <AdminSection title="Resources" limitLabel={`Latest ${ADMIN_TABLE_LIMIT}`}>
          <AdminTable
            emptyMessage="No resource stockpiles found."
            headers={["Kingdom", "Money", "Food", "Manpower", "Knowledge"]}
          >
            {data.resources.map((row) => (
              <tr key={row.kingdomName}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.kingdomName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatNullableNumber(row.money)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatNullableNumber(row.food)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatNullableNumber(row.manpower)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatNullableNumber(row.knowledge)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <AdminSection
          title="Districts"
          limitLabel={`Latest ${ADMIN_DETAIL_TABLE_LIMIT}`}
        >
          <AdminTable
            emptyMessage="No districts found."
            headers={["Kingdom", "District", "Allocated land", "Used land", "Free land"]}
          >
            {data.districts.map((row) => (
              <tr key={`${row.kingdomName}-${row.type}`}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.kingdomName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.typeLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatLand(row.allocatedLandM2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatLand(row.usedLandM2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatLand(row.freeLandM2)}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <AdminSection
          title="Buildings"
          limitLabel={`Latest ${ADMIN_DETAIL_TABLE_LIMIT}`}
        >
          <AdminTable
            emptyMessage="No buildings found."
            headers={["Kingdom", "Building", "Level", "Status", "Land used", "District"]}
          >
            {data.buildings.map((row, index) => (
              <tr key={`${row.kingdomName}-${row.type}-${row.districtType}-${index}`}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.kingdomName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.typeLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.level}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.statusLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatLand(row.landUsedM2)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.districtLabel}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <AdminSection title="Units" limitLabel={`Latest ${ADMIN_DETAIL_TABLE_LIMIT}`}>
          <AdminTable
            emptyMessage="No units found."
            headers={["Kingdom", "Unit", "Quantity", "Location"]}
          >
            {data.units.map((row) => (
              <tr key={`${row.kingdomName}-${row.unitType}-${row.locationType}`}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.kingdomName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.unitLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatNumber(row.quantity)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.locationLabel}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>

        <AdminSection
          title="Reports Preview"
          limitLabel={`Latest ${ADMIN_REPORT_PREVIEW_LIMIT}`}
        >
          <AdminTable
            emptyMessage="No reports found."
            headers={["Type", "Title", "Kingdom", "Created", "State"]}
          >
            {data.reports.map((row) => (
              <tr key={`${row.kingdomName}-${row.title}-${row.createdAt.toISOString()}`}>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.typeLabel}
                </td>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-neutral-950">
                  {row.title}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.kingdomName}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {formatDate(row.createdAt)}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.readState}
                </td>
              </tr>
            ))}
          </AdminTable>
        </AdminSection>
      </div>
    </main>
  );
}
