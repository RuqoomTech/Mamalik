import Link from "next/link";
import type { ReactNode } from "react";

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
  { href: "/world", label: "World", section: "world" },
  { href: "/economy", label: "Economy", section: "economy" },
  { href: "/land", label: "Land", section: "land" },
  { href: "/buildings", label: "Buildings", section: "buildings" },
  { href: "/army", label: "Army", section: "army" },
  { href: "/reports", label: "Reports", section: "reports" },
];

export function KingdomAppShell({
  activeSection,
  children,
  isAdmin,
  kingdomName,
  kingdomSlug,
}: {
  activeSection: KingdomAppSection;
  children: ReactNode;
  isAdmin: boolean;
  kingdomName: string;
  kingdomSlug: string;
}) {
  return (
    <main className="mamalik-page">
      <div className="mamalik-container space-y-6">
        <header className="mamalik-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5ebe1] px-5 py-4">
            <div>
              <p className="mamalik-eyebrow">Kingdom command</p>
              <h1 className="mt-1 text-2xl font-semibold text-[#10140f]">
                {kingdomName}
              </h1>
              <p className="mt-1 text-sm text-[#5f665d]">@{kingdomSlug}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              {isAdmin ? (
                <Link className="mamalik-action-secondary px-4 py-2" href="/admin">
                  Admin
                </Link>
              ) : null}
              <Link className="mamalik-action-secondary px-4 py-2" href="/">
                Home
              </Link>
              <form action="/api/auth/logout" method="post">
                <button className="mamalik-action-secondary px-4 py-2" type="submit">
                  Log out
                </button>
              </form>
            </div>
          </div>
          <nav
            aria-label="Kingdom sections"
            className="flex flex-wrap gap-2 px-5 py-3"
          >
            {navigationItems.map((item) => {
              const isActive = item.section === activeSection;

              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={
                    isActive
                      ? "rounded-md bg-[#183f35] px-3 py-2 text-sm font-semibold text-white"
                      : "rounded-md px-3 py-2 text-sm font-semibold text-[#445044] hover:bg-[#f0f4ee]"
                  }
                  href={item.href}
                  key={item.section}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}
