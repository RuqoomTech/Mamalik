import type { Metadata } from "next";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "How to Play | Mamalik",
  description: "How to begin playing Mamalik.",
};

const steps = [
  "Create an account with email/password or Google login.",
  "Choose a valid land point on the world map and confirm your kingdom name.",
  "Review your starting land, resources, districts, buildings, population, and army.",
  "Use the dashboard and focused pages to monitor economy ticks, land, buildings, army, and reports.",
  "Prepare for the next v0.1 combat systems: scouting, movement, attacks, and alliances.",
];

export default function HowToPlayPage() {
  return (
    <MarketingInfoPage
      active="how-to-play"
      eyebrow="First steps"
      title="Start with land, then build the realm."
      description="Mamalik starts with a valid kingdom location and grows through land credit, district choices, economy ticks, reports, and future conflict."
    >
      <article className="marketing-info-card">
        <h2>Opening flow</h2>
        <ol>
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>
      <div className="marketing-section-grid">
        <article className="marketing-info-card">
          <h2>Starting land</h2>
          <p>
            Every new kingdom begins with 50,000 m2 of gameplay usable land
            credit and a server-generated visible border preview.
          </p>
        </article>
        <article className="marketing-info-card">
          <h2>Starting economy</h2>
          <p>
            Your first resources, districts, buildings, population, Infantry,
            and Archers are seeded by the server during kingdom creation.
          </p>
        </article>
        <article className="marketing-info-card">
          <h2>Protection</h2>
          <p>
            New kingdoms receive beginner protection so players can build,
            train, buy land, and prepare before player conflict opens.
          </p>
        </article>
      </div>
    </MarketingInfoPage>
  );
}
