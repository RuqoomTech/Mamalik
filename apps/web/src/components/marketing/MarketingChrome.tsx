import Image from "next/image";
import Link from "next/link";

type MarketingChromeProps = {
  active?: "features" | "about" | "how-to-play" | "roadmap" | "updates" | "careers" | "contact";
  children: React.ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const navItems = [
  { key: "how-to-play", label: "How to play", href: "/how-to-play" },
  { key: "features", label: "Features", href: "/features" },
  { key: "roadmap", label: "Roadmap", href: "/roadmap" },
  { key: "about", label: "About", href: "/about" },
] as const;

const footerLinks = [
  { label: "How to play", href: "/how-to-play" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Updates", href: "/updates" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
];

export function MarketingChrome({
  active,
  children,
  primaryHref = "/register",
  primaryLabel = "Start your kingdom",
  secondaryHref = "/login",
  secondaryLabel = "Log in",
}: MarketingChromeProps) {
  return (
    <main className="flex min-h-screen flex-col bg-mk-surface text-mk-ink">
      <header className="sticky top-0 z-20 border-b border-mk-line bg-mk-surface/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link aria-label="Mamalik home" className="flex shrink-0 items-center gap-2.5" href="/">
            <Image alt="" height={34} priority src="/brand/mamalik-mark.png" width={34} />
            <span className="mamalik-display text-lg tracking-wide">Mamalik</span>
            <span className="hidden text-sm text-mk-muted sm:inline" lang="ar">
              ممالك
            </span>
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-6 text-sm md:flex">
            {navItems.map((item) => (
              <Link
                aria-current={active === item.key ? "page" : undefined}
                className={active === item.key ? "font-semibold text-mk-ink" : "text-mk-muted hover:text-mk-ink"}
                href={item.href}
                key={item.key}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link className="px-2 py-2 text-sm text-mk-muted hover:text-mk-ink" href={secondaryHref}>
              {secondaryLabel}
            </Link>
            <Link className="mamalik-action-primary px-4 py-2" href={primaryHref}>
              {primaryLabel}
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <MarketingFooter />
    </main>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-mk-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-mk-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          <span className="mamalik-display text-mk-ink">Mamalik</span> · A strategy game on the real world map.
        </p>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2">
          {footerLinks.map((link) => (
            <Link className="hover:text-mk-ink" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}

type MarketingInfoPageProps = {
  active?: MarketingChromeProps["active"];
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function MarketingInfoPage({ active, eyebrow, title, description, children }: MarketingInfoPageProps) {
  return (
    <MarketingChrome active={active}>
      <section className="border-b border-mk-line">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="mamalik-eyebrow">{eyebrow}</p>
          <h1 className="mamalik-display mt-3 text-4xl leading-tight sm:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-mk-muted">{description}</p>
        </div>
      </section>
      <section className="marketing-info-content mx-auto max-w-3xl space-y-4 px-4 py-10 sm:px-6">{children}</section>
    </MarketingChrome>
  );
}
