import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { NextTickCountdown } from "@/components/kingdom/NextTickCountdown";
import type { KingdomDashboardData } from "@/lib/kingdom/dashboard-data";

export type KingdomAppSection =
  | "dashboard"
  | "world"
  | "economy"
  | "land"
  | "buildings"
  | "army"
  | "reports";

const navigationItems: Array<{
  href: string;
  label: string;
  section: KingdomAppSection;
}> = [
  { href: "/dashboard", label: "Overview", section: "dashboard" },
  { href: "/world", label: "Map", section: "world" },
  { href: "/economy", label: "Economy", section: "economy" },
  { href: "/land", label: "Land", section: "land" },
  { href: "/buildings", label: "Buildings", section: "buildings" },
  { href: "/army", label: "Army", section: "army" },
  { href: "/reports", label: "Reports", section: "reports" },
];

const numberFormatter = new Intl.NumberFormat("en-US");

function ResourceBar({ data }: { data: KingdomDashboardData }) {
  const { resources, economyEstimate } = data;
  const items = [
    { label: "Money", value: resources.money, perTick: economyEstimate.money.total },
    { label: "Food", value: resources.food, perTick: economyEstimate.food.net },
    { label: "Manpower", value: resources.manpower, perTick: economyEstimate.manpower.total },
    { label: "Knowledge", value: resources.knowledge, perTick: economyEstimate.knowledge.total },
  ];

  return (
    <dl className="mamalik-card grid grid-cols-2 sm:grid-cols-4">
      {items.map((item, index) => (
        <div
          className={`px-4 py-3 ${index % 2 === 1 ? "border-l border-mk-line" : ""} ${
            index > 1 ? "border-t border-mk-line sm:border-t-0" : ""
          } ${index === 2 ? "sm:border-l" : ""}`}
          key={item.label}
        >
          <dt className="text-xs text-mk-muted">{item.label}</dt>
          <dd className="mt-0.5 flex items-baseline justify-between gap-2">
            <span className="text-lg font-semibold tabular-nums text-mk-ink">
              {numberFormatter.format(item.value)}
            </span>
            <span
              className={`text-xs tabular-nums ${item.perTick < 0 ? "text-mk-danger" : "text-mk-success"}`}
              title="Change per tick (10 minutes)"
            >
              {item.perTick > 0 ? "+" : ""}
              {numberFormatter.format(item.perTick)}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function KingdomAppShell({
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
  return (
    <main className="mamalik-page">
      <header className="border-b border-mk-line bg-mk-surface">
        <div className="mx-auto flex max-w-[68rem] items-center justify-between gap-4 px-4 pt-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <Link aria-label="Mamalik home" className="shrink-0" href="/">
              <Image alt="" height={32} src="/brand/mamalik-mark.png" width={32} />
            </Link>
            <h1 className="truncate text-base font-semibold text-mk-ink">{data.kingdom.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm">
            {isAdmin ? (
              <Link className="rounded px-2 py-1.5 text-mk-muted hover:text-mk-ink" href="/admin">
                Admin
              </Link>
            ) : null}
            <form action="/api/auth/logout" method="post">
              <button className="rounded px-2 py-1.5 text-mk-muted hover:text-mk-ink" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>
        <nav
          aria-label="Kingdom sections"
          className="mamalik-scroll-x mx-auto flex max-w-[68rem] overflow-x-auto px-2 sm:px-3"
        >
          {navigationItems.map((item) => {
            const isActive = item.section === activeSection;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 border-b-2 px-3 pb-2.5 pt-3 text-sm ${
                  isActive
                    ? "border-mk-ink font-semibold text-mk-ink"
                    : "border-transparent text-mk-muted hover:text-mk-ink"
                }`}
                href={item.href}
                key={item.section}
              >
                {item.label}
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
