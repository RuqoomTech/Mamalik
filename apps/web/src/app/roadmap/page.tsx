import type { Metadata } from "next";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "Roadmap | Mamalik",
  description: "Mamalik v0.1 roadmap.",
};

const roadmap = [
  {
    status: "Complete",
    title: "Sprint 1 - Foundation + Kingdom Creation",
    body: "Auth, Google login, protected routes, MapLibre kingdom selection, validation flow, kingdom creation, starter state, dashboard, and admin foundation.",
  },
  {
    status: "Complete",
    title: "Sprint 2 - Tick Engine + Economy",
    body: "Tick logs, duplicate protection, resources, Food consumption, population effects, construction progress, training progress, dashboard visibility, and admin tick control.",
  },
  {
    status: "Complete",
    title: "Sprint 3 - Land + Districts",
    body: "Land packages, prices, cooldowns, purchase reports, dashboard purchase UI, district land overview, and unused-land allocation.",
  },
  {
    status: "Complete",
    title: "Sprint 4 - Map Validation + Borders",
    body: "PostGIS preview polygons, water rejection, restricted zones, overlap, spacing, nearby suggestions, and map-preview UI.",
  },
  {
    status: "Next",
    title: "Sprint 5 - Movement + Scouting + Combat",
    body: "Distance-based orders, scouting, approximate reports, attacks, defender bonuses, siege requirements, land capture limits, and battle reports.",
  },
  {
    status: "Upcoming",
    title: "Sprint 6 - Alliances + Reports + Rankings",
    body: "Simple alliances, report center polish, notifications, rankings, and admin polish.",
  },
];

export default function RoadmapPage() {
  return (
    <MarketingInfoPage
      active="roadmap"
      eyebrow="v0.1 roadmap"
      title="The world is built one verified sprint at a time."
      description="The roadmap keeps the game focused on the v0.1 loop before advanced diplomacy, chat, mobile, payments, and area bonuses."
    >
      <div className="marketing-section-grid">
        {roadmap.map((item) => (
          <article className="marketing-info-card" key={item.title}>
            <span className="marketing-status">{item.status}</span>
            <h2>{item.title}</h2>
            <p>{item.body}</p>
          </article>
        ))}
      </div>
    </MarketingInfoPage>
  );
}
