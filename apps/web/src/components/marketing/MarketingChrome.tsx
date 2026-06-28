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

const communityLinks = [
  { label: "Community updates", href: "/updates", icon: "chat" },
  { label: "Roadmap", href: "/roadmap", icon: "bird" },
  { label: "Player hub", href: "/features", icon: "forum" },
  { label: "Contact Mamalik", href: "/contact", icon: "mail" },
] as const;

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
            {communityLinks.map((link) => (
              <Link key={link.label} href={link.href} aria-label={link.label}>
                <CommunityIcon kind={link.icon} />
              </Link>
            ))}
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

type CommunityIconKind = (typeof communityLinks)[number]["icon"];

function CommunityIcon({ kind }: { kind: CommunityIconKind }) {
  if (kind === "bird") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M20 6.5c-.7.3-1.4.5-2.2.6.8-.5 1.3-1.1 1.6-2-.7.4-1.5.7-2.4.9A3.7 3.7 0 0 0 10.6 9c0 .3 0 .6.1.8-3.1-.2-5.8-1.6-7.6-3.8-.3.6-.5 1.2-.5 1.9 0 1.3.7 2.4 1.7 3.1-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.7-.3.1-.7.1-1.1.1-.3 0-.5 0-.8-.1.5 1.5 1.9 2.6 3.6 2.6A7.5 7.5 0 0 1 2.7 18c-.3 0-.6 0-.9-.1 1.7 1.1 3.7 1.7 5.8 1.7 7 0 10.8-5.8 10.8-10.8v-.5c.7-.5 1.2-1.1 1.6-1.8Z" />
      </svg>
    );
  }

  if (kind === "forum") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8" />
        <circle cx="9" cy="11" r="1.2" />
        <circle cx="12" cy="11" r="1.2" />
        <circle cx="15" cy="11" r="1.2" />
        <path d="m8 18-2 3 5-1" />
      </svg>
    );
  }

  if (kind === "mail") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16v10H4V7Z" />
        <path d="m4 8 8 6 8-6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 6h14v10H9l-4 4V6Z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </svg>
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
