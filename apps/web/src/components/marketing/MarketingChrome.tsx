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
  { key: "features", label: "Features", href: "/features" },
  { key: "about", label: "About", href: "/about" },
  { key: "how-to-play", label: "How to Play", href: "/how-to-play" },
  { key: "roadmap", label: "Roadmap", href: "/roadmap" },
] as const;

const gameLinks = [
  { label: "How to Play", href: "/how-to-play" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Updates", href: "/updates" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
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
    <main className="marketing-page">
      <div className="marketing-frame">
        <header className="marketing-header">
          <Link className="marketing-brand" href="/" aria-label="Mamalik home">
            <Image
              src="/brand/mamalik-logo.png"
              alt=""
              width={72}
              height={72}
              priority
              className="marketing-brand-mark"
            />
            <span className="marketing-brand-name">Mamalik</span>
          </Link>

          <nav className="marketing-nav" aria-label="Main navigation">
            {navItems.map((item) => (
              <Link
                key={item.key}
                className={active === item.key ? "is-active" : ""}
                href={item.href}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="marketing-header-actions">
            <Link className="marketing-button marketing-button-secondary" href={secondaryHref}>
              {secondaryLabel}
            </Link>
            <Link className="marketing-button marketing-button-primary" href={primaryHref}>
              {primaryLabel}
            </Link>
          </div>
        </header>

        {children}
      </div>

      <MarketingFooter />
    </main>
  );
}

export function MarketingFooter() {
  return (
    <footer className="marketing-footer">
      <div className="marketing-footer-inner">
        <section className="marketing-footer-brand">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/mamalik-logo.png"
              alt=""
              width={64}
              height={64}
              className="marketing-footer-mark"
            />
            <span>Mamalik</span>
          </div>
          <p>
            A browser strategy game where you build, govern, and expand your
            kingdom across a living world.
          </p>
        </section>

        <FooterColumn title="Game" links={gameLinks} />
        <FooterColumn title="Company" links={companyLinks} />
        <FooterColumn title="Legal" links={legalLinks} />

        <section className="marketing-footer-community">
          <h2>Join our community</h2>
          <div className="marketing-community-links">
            <Link href="/contact" aria-label="Contact Mamalik by email">
              Mail
            </Link>
            <Link href="/updates" aria-label="Read Mamalik updates">
              News
            </Link>
            <Link href="/roadmap" aria-label="View Mamalik roadmap">
              Plan
            </Link>
          </div>
        </section>
      </div>
      <p className="marketing-footer-copy">Copyright 2026 Mamalik. All rights reserved.</p>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  links: Array<{
    label: string;
    href: string;
  }>;
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <section className="marketing-footer-column">
      <h2>{title}</h2>
      <ul>
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

type MarketingInfoPageProps = {
  active?: MarketingChromeProps["active"];
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

export function MarketingInfoPage({
  active,
  eyebrow,
  title,
  description,
  children,
}: MarketingInfoPageProps) {
  return (
    <MarketingChrome active={active}>
      <section className="marketing-info-hero">
        <p className="marketing-kicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </section>
      <section className="marketing-info-content">{children}</section>
    </MarketingChrome>
  );
}
