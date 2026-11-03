import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { NextTickCountdown } from "@/components/kingdom/NextTickCountdown";
import { PreferenceControls } from "@/components/preferences/PreferenceControls";
import { formatSigned } from "@/i18n/game-text";
import { formatNumber } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import type { KingdomDashboardData } from "@/lib/kingdom/dashboard-data";

export type KingdomAppSection =
  | "dashboard"
  | "world"
  | "economy"
  | "land"
  | "buildings"
  | "army"
  | "war"
  | "reports";

const navigationItems: Array<{ href: string; section: KingdomAppSection }> = [
  { href: "/dashboard", section: "dashboard" },
  { href: "/world", section: "world" },
  { href: "/economy", section: "economy" },
  { href: "/land", section: "land" },
  { href: "/buildings", section: "buildings" },
  { href: "/army", section: "army" },
  { href: "/war", section: "war" },
  { href: "/reports", section: "reports" },
];

async function ResourceBar({ data }: { data: KingdomDashboardData }) {
  const { m } = await getI18n();
  const { resources, economyEstimate } = data;
  const items = [
    { label: m.resources.money, value: resources.money, perTick: economyEstimate.money.total },
    { label: m.resources.food, value: resources.food, perTick: economyEstimate.food.net },
    { label: m.resources.manpower, value: resources.manpower, perTick: economyEstimate.manpower.total },
    { label: m.resources.knowledge, value: resources.knowledge, perTick: economyEstimate.knowledge.total },
  ];

  return (
    <dl className="mamalik-card grid grid-cols-2 sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          className={`px-4 py-3 ${index % 2 === 1 ? "border-s border-mk-line" : ""} ${
            index > 1 ? "border-t border-mk-line sm:border-t-0" : ""
          } ${index === 2 ? "sm:border-s" : ""}`}
          key={item.label}
        >
          <dt className="text-xs text-mk-muted">{item.label}</dt>
          <dd className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="text-lg font-semibold tabular-nums text-mk-ink">{formatNumber(item.value)}</span>
            <span
              className={`text-xs tabular-nums ${item.perTick < 0 ? "text-mk-danger" : "text-mk-success"}`}
              dir="ltr"
              title={m.resources.perTickTitle}
            >
              {formatSigned(item.perTick)}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export async function KingdomAppShell({
  activeSection,
  children,
  data,
  isAdmin,
}: {
  activeSection: KingdomAppSection;
  children: ReactNode;
  data: KingdomDashboardData;
  isAdmin: boolean;
}) {
  const { m } = await getI18n();

  return (
    <main className="mamalik-page">
      <header className="border-b border-mk-line bg-mk-surface">
        <div className="mx-auto flex max-w-[68rem] items-center justify-between gap-4 px-4 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link aria-label={m.common.homeLabel} className="shrink-0" href="/">
              <Image alt="" height={32} src="/brand/mamalik-mark.png" width={32} />
            </Link>
            <h1 className="truncate text-base font-semibold text-mk-ink">{data.kingdom.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm">
            <PreferenceControls />
            {isAdmin ? (
              <Link className="rounded px-2 py-1.5 text-mk-muted hover:text-mk-ink" href="/admin">
                {m.common.admin}
              </Link>
            ) : null}
            <form action="/api/auth/logout" method="post">
              <button className="rounded px-2 py-1.5 text-mk-muted hover:text-mk-ink" type="submit">
                {m.common.logOut}
              </button>
            </form>
          </div>
        </div>
        <nav aria-label={m.nav.label} className="mamalik-scroll-x mx-auto flex max-w-[68rem] overflow-x-auto px-2 sm:px-3">
          {navigationItems.map((item) => {
            const isActive = item.section === activeSection;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 border-b-2 px-3 pb-2.5 pt-3 text-sm ${
                  isActive ? "border-mk-ink font-semibold text-mk-ink" : "border-transparent text-mk-muted hover:text-mk-ink"
                }`}
                href={item.href}
                key={item.section}
              >
                {m.nav[item.section]}
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="mamalik-container space-y-7">
        <div className="space-y-1.5">
          <div className="flex justify-end">
            <NextTickCountdown />
          </div>
          <ResourceBar data={data} />
        </div>
        {children}
      </div>
    </main>
  );
}

export function PageIntro({ children, title }: { children?: ReactNode; title: string }) {
  return (
    <section>
      <h2 className="text-xl font-semibold text-mk-ink">{title}</h2>
      {children ? <p className="mt-1 max-w-2xl text-sm text-mk-muted">{children}</p> : null}
    </section>
  );
}
