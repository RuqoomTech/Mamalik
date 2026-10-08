import Image from "next/image";
import Link from "next/link";
import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getPostLoginDestination } from "@/lib/auth/route-destinations";
import { getPrismaClient } from "@/lib/db/client";

export const dynamic = "force-dynamic";

const steps = [
  {
    title: "Claim a place on the real map",
    body: "Search any city or coast, pick a free spot, and found your kingdom with 50,000 m² of land.",
  },
  {
    title: "Grow every ten minutes",
    body: "Farms, markets, and houses pay out each tick. Build, upgrade, and train while you are away.",
  },
  {
    title: "Push your borders outward",
    body: "Buy land and watch your territory spread across the map, right up to your neighbours.",
  },
] as const;

const facts = [
  ["10 min", "per tick"],
  ["4", "resources"],
  ["10", "building types"],
  ["5", "unit types"],
] as const;

async function countKingdoms(): Promise<number | null> {
  try {
    return await getPrismaClient().kingdom.count();
  } catch {
    return null;
  }
}

export default async function Home() {
  const [user, kingdomCount] = await Promise.all([getCurrentUser(), countKingdoms()]);
  const appDestination = user ? getPostLoginDestination(user) : "/register";
  const primaryLabel = user?.kingdom ? "Open your kingdom" : "Start your kingdom";
  const secondaryHref = user ? appDestination : "/login";
  const secondaryLabel = user ? "Enter game" : "Log in";

  return (
    <MarketingChrome
      primaryHref={appDestination}
      primaryLabel={user?.kingdom ? "Play" : "Play free"}
      secondaryHref={secondaryHref}
      secondaryLabel={secondaryLabel}
    >
      <section className="relative overflow-hidden border-b border-mk-line bg-[#efe9dc]">
        <div className="relative z-10 mx-auto max-w-6xl px-4 pb-10 pt-12 sm:px-6 md:pb-28 md:pt-24">
          <div className="max-w-xl">
            <p className="mamalik-eyebrow">A strategy game on the real world map</p>
            <h1 className="mamalik-display mt-4 text-5xl leading-[1.05] text-mk-ink sm:text-6xl">
              Claim your land.
              <br />
              Build your kingdom.
            </h1>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-[#3d413b]">
              Found a kingdom anywhere on Earth, grow it every ten minutes, and push your
              borders out across the map.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link className="mamalik-action-primary px-5 py-3 text-base" href={appDestination}>
                {primaryLabel}
              </Link>
              <Link
                className="rounded-md px-4 py-3 text-base font-semibold text-mk-ink underline-offset-4 hover:underline"
                href={secondaryHref}
              >
                {secondaryLabel}
              </Link>
            </div>
            <p className="mt-6 text-sm text-mk-muted">
              Free · Plays in your browser
              {kingdomCount ? ` · ${kingdomCount} kingdom${kingdomCount === 1 ? "" : "s"} founded` : ""}
            </p>
          </div>
        </div>

        <div className="relative aspect-[16/10] w-full md:absolute md:inset-0 md:aspect-auto">
          <Image
            alt="Hand-drawn map of a coast with three walled cities inside their territory borders"
            className="object-cover object-[75%_50%] md:object-right"
            fill
            priority
            sizes="100vw"
            src="/brand/mamalik-atlas-hero.jpg"
          />
          <div
            aria-hidden
            className="absolute inset-0 hidden bg-gradient-to-r from-[#efe9dc] via-[#efe9dc]/70 to-transparent md:block md:w-[55%]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <h2 className="mamalik-display text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-8 border-t border-mk-line pt-8 md:grid-cols-3 md:gap-10">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="text-sm tabular-nums text-mk-muted">0{index + 1}</span>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 leading-relaxed text-mk-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-mk-line bg-mk-canvas">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 px-4 sm:px-6 md:grid-cols-4">
          {facts.map(([value, label], index) => (
            <div
              className={`py-8 ${index % 2 === 1 ? "pl-6 border-l border-mk-line" : ""} ${
                index === 2 ? "md:border-l md:border-mk-line md:pl-6" : ""
              } ${index > 1 ? "border-t border-mk-line md:border-t-0" : ""}`}
              key={label}
            >
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="mamalik-display block text-3xl">{value}</span>
                <span className="text-sm text-mk-muted">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <h2 className="mamalik-display text-3xl sm:text-4xl">The map is open. Pick your spot.</h2>
        <p className="mx-auto mt-3 max-w-md text-mk-muted">
          New kingdoms get three days of protection to build before rivals can strike.
        </p>
        <Link className="mamalik-action-primary mt-8 px-6 py-3 text-base" href={appDestination}>
          {primaryLabel}
        </Link>
      </section>
    </MarketingChrome>
  );
}
