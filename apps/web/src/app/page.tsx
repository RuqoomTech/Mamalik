import Image from "next/image";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPostLoginDestination } from "@/lib/auth/route-destinations";

const featureCards = [
  {
    icon: "castle",
    title: "Create & Customize",
    body: "Design your kingdom, choose your crest, and shape your realm.",
    href: "/features",
  },
  {
    icon: "shield",
    title: "Expand & Conquer",
    body: "Claim new territories and grow your influence across the map.",
    href: "/how-to-play",
  },
  {
    icon: "alliance",
    title: "Alliance & Strategize",
    body: "Prepare alliances, trade plans, and war paths as the v0.1 roadmap opens.",
    href: "/roadmap",
  },
] as const;

const trustItems = [
  {
    icon: "fair",
    title: "Secure & Fair",
    body: "Built for a positive and inclusive experience.",
  },
  {
    icon: "trophy",
    title: "Strategic Depth",
    body: "Every decision shapes your legacy.",
  },
  {
    icon: "world",
    title: "A Living World",
    body: "A persistent world that evolves.",
  },
  {
    icon: "community",
    title: "Community First",
    body: "Active players, fair rules, and updates driven by you.",
  },
] as const;

export default function Home() {
  return <HomeContent />;
}

async function HomeContent() {
  const user = await getCurrentUser();
  const appDestination = user ? getPostLoginDestination(user) : "/register";
  const primaryLabel = user?.kingdom ? "Open dashboard" : "Start your kingdom";
  const secondaryHref = user ? appDestination : "/login";
  const secondaryLabel = user ? "Enter game" : "Log in";

  return (
    <MarketingChrome
      primaryHref={appDestination}
      primaryLabel={primaryLabel}
      secondaryHref={secondaryHref}
      secondaryLabel={secondaryLabel}
    >
      <section className="marketing-hero">
        <div className="marketing-hero-copy">
          <p className="marketing-kicker">Rule your world</p>
          <h1>Build your kingdom on the world map.</h1>
          <p>
            Create your kingdom, expand across territories, manage your
            districts, and lead your realm to glory in a living world of strategy
            and alliances.
          </p>

          <div className="marketing-hero-actions">
            <Link className="marketing-button marketing-button-primary" href={appDestination}>
              {primaryLabel}
              <ArrowIcon />
            </Link>
            <Link className="marketing-button marketing-button-secondary" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          <p className="marketing-hero-note">
            <span aria-hidden="true">
              <TrustIcon kind="fair" />
            </span>
            Free to start. Strategy forever.
          </p>
        </div>

        <div className="marketing-hero-art" aria-label="Illustrated kingdom world">
          <Image
            src="/brand/mamalik-hero-world.png"
            alt="A fantasy kingdom overlooking coast, forests, rivers, and mountains"
            fill
            priority
            sizes="(max-width: 980px) 100vw, 58vw"
            className="marketing-hero-image"
          />
        </div>
      </section>

      <section className="marketing-feature-band" aria-label="Mamalik features">
        {featureCards.map((card) => (
          <article className="marketing-feature-card" key={card.title}>
            <span className="marketing-card-icon" aria-hidden="true">
              <FeatureIcon kind={card.icon} />
            </span>
            <div>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              <Link href={card.href}>
                Learn more
                <ArrowIcon />
              </Link>
            </div>
          </article>
        ))}
      </section>

      <section className="marketing-trust-band" aria-label="Mamalik principles">
        {trustItems.map((item) => (
          <article className="marketing-trust-item" key={item.title}>
            <span aria-hidden="true">
              <TrustIcon kind={item.icon} />
            </span>
            <div>
              <h2>{item.title}</h2>
              <p>{item.body}</p>
            </div>
          </article>
        ))}
      </section>
    </MarketingChrome>
  );
}

type FeatureIconKind = (typeof featureCards)[number]["icon"];
type TrustIconKind = (typeof trustItems)[number]["icon"];

function FeatureIcon({ kind }: { kind: FeatureIconKind }) {
  if (kind === "shield") {
    return (
      <svg viewBox="0 0 64 64">
        <path d="M32 6 52 14v16c0 13-8 23-20 28C20 53 12 43 12 30V14L32 6Z" />
        <path d="M32 13v38" />
        <path d="M22 29h20" />
      </svg>
    );
  }

  if (kind === "alliance") {
    return (
      <svg viewBox="0 0 64 64">
        <circle cx="24" cy="22" r="8" />
        <circle cx="43" cy="24" r="7" />
        <path d="M9 52c2-12 10-18 18-18s15 6 17 18H9Z" />
        <path d="M35 52c1-8 7-13 14-13 5 0 9 4 11 13H35Z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 64 64">
      <path d="M14 52h36" />
      <path d="M18 52V27l14-13 14 13v25" />
      <path d="M10 52V34l8-7" />
      <path d="M54 52V34l-8-7" />
      <path d="M27 52V38h10v14" />
      <path d="M24 29h5" />
      <path d="M35 29h5" />
      <path d="M32 14V7" />
    </svg>
  );
}

function TrustIcon({ kind }: { kind: TrustIconKind }) {
  if (kind === "trophy") {
    return (
      <svg viewBox="0 0 48 48">
        <path d="M16 7h16v9c0 8-3 13-8 15-5-2-8-7-8-15V7Z" />
        <path d="M16 12H8c0 7 3 11 9 12" />
        <path d="M32 12h8c0 7-3 11-9 12" />
        <path d="M24 31v8" />
        <path d="M15 41h18" />
      </svg>
    );
  }

  if (kind === "world") {
    return (
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="24" r="17" />
        <path d="M7 24h34" />
        <path d="M24 7c5 5 7 11 7 17s-2 12-7 17" />
        <path d="M24 7c-5 5-7 11-7 17s2 12 7 17" />
      </svg>
    );
  }

  if (kind === "community") {
    return (
      <svg viewBox="0 0 48 48">
        <circle cx="24" cy="16" r="6" />
        <circle cx="12" cy="21" r="5" />
        <circle cx="36" cy="21" r="5" />
        <path d="M12 39c1-8 6-12 12-12s11 4 12 12" />
        <path d="M3 38c1-6 4-9 9-9" />
        <path d="M45 38c-1-6-4-9-9-9" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 48 48">
      <path d="M24 5 38 10v12c0 10-6 17-14 21-8-4-14-11-14-21V10l14-5Z" />
      <path d="m17 24 5 5 10-12" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8h9" />
      <path d="m9 4 4 4-4 4" />
    </svg>
  );
}
