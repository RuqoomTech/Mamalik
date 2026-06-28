import type { Metadata } from "next";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "Features | Mamalik",
  description: "Core v0.1 features for Mamalik, a browser strategy MMO.",
};

const features = [
  {
    status: "Available foundation",
    title: "Real-world kingdom starts",
    body: "Create a kingdom from a map-selected point with server-side land, water, restricted-zone, overlap, and spacing validation.",
  },
  {
    status: "Available foundation",
    title: "District management",
    body: "Grow around Economic, Residential, Military, Defensive, and Research districts while keeping gameplay land separate from visible borders.",
  },
  {
    status: "Available foundation",
    title: "Tick economy",
    body: "Money, Food, Manpower, Knowledge, construction, and training queues advance through deterministic 10-minute tick rules.",
  },
  {
    status: "Available foundation",
    title: "Land packages",
    body: "Buy fixed land packages with server-calculated prices, package cooldowns, reports, and district allocation controls.",
  },
  {
    status: "Next v0.1 sprint",
    title: "Scouting and combat",
    body: "Sprint 5 adds distance-based orders, approximate scouting, basic battles, defender bonuses, siege rules, and reports.",
  },
  {
    status: "Later v0.1 sprint",
    title: "Alliances and rankings",
    body: "Sprint 6 adds simple alliances, report polish, leaderboards, and admin tools for the persistent world.",
  },
];

export default function FeaturesPage() {
  return (
    <MarketingInfoPage
      active="features"
      eyebrow="Game systems"
      title="A strategy world built in clear v0.1 layers."
      description="Mamalik grows through small, verified systems: real map starts, land credit, districts, ticks, reports, and then conflict."
    >
      <div className="marketing-section-grid">
        {features.map((feature) => (
          <article className="marketing-info-card" key={feature.title}>
            <span className="marketing-status">{feature.status}</span>
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </div>
    </MarketingInfoPage>
  );
}
