import Image from "next/image";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPostLoginDestination } from "@/lib/auth/route-destinations";

const featureCards = [
  {
    icon: "M",
    title: "Create & Command",
    body: "Choose a valid real-world start, name your kingdom, and begin with districts, buildings, and a starter army.",
    href: "/features",
  },
  {
    icon: "L",
    title: "Expand & Govern",
    body: "Buy land packages, allocate unused land into districts, and watch your economy update through 10-minute ticks.",
    href: "/how-to-play",
  },
  {
    icon: "A",
    title: "Prepare for War",
    body: "Movement, scouting, combat, alliances, and rankings are the next v0.1 systems on the public roadmap.",
    href: "/roadmap",
  },
];

const trustItems = [
  {
    icon: "S",
    title: "Secure & Fair",
    body: "Server-side validation protects account, land, resource, and kingdom actions.",
  },
  {
    icon: "T",
    title: "Strategic Depth",
    body: "Districts, ticks, land, armies, and reports create clear management choices.",
  },
  {
    icon: "W",
    title: "A Living World",
    body: "A persistent real-world map anchors every kingdom and future conflict.",
  },
  {
    icon: "C",
    title: "Community First",
    body: "The roadmap keeps v0.1 focused before alliances and rankings expand the world.",
  },
];

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
            Create your kingdom, grow across districts, prepare armies, and lead
            your realm through a persistent strategy world built around real map
            locations.
          </p>

          <div className="marketing-hero-actions">
            <Link className="marketing-button marketing-button-primary" href={appDestination}>
              {primaryLabel}
            </Link>
            <Link className="marketing-button marketing-button-secondary" href={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          <p className="marketing-hero-note">
            <span aria-hidden="true">OK</span>
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
          <div className="marketing-kingdom-stat" aria-label="Kingdom preview">
            <h2>
              Your Kingdom
            </h2>
            <dl>
              <div>
                <dt>People</dt>
                <dd>2.4K</dd>
              </div>
              <div>
                <dt>Guard</dt>
                <dd>12</dd>
              </div>
              <div>
                <dt>Food</dt>
                <dd>650</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section className="marketing-feature-band" aria-label="Mamalik features">
        {featureCards.map((card) => (
          <article className="marketing-feature-card" key={card.title}>
            <span className="marketing-card-icon" aria-hidden="true">
              {card.icon}
            </span>
            <div>
              <h2>{card.title}</h2>
              <p>{card.body}</p>
              <Link href={card.href}>Learn more -&gt;</Link>
            </div>
          </article>
        ))}
      </section>

      <section className="marketing-trust-band" aria-label="Mamalik principles">
        {trustItems.map((item) => (
          <article className="marketing-trust-item" key={item.title}>
            <span aria-hidden="true">{item.icon}</span>
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
