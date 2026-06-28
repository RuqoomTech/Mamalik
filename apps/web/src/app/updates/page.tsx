import type { Metadata } from "next";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "Updates | Mamalik",
  description: "Recent Mamalik development updates.",
};

export default function UpdatesPage() {
  return (
    <MarketingInfoPage
      active="updates"
      eyebrow="Updates"
      title="Recent progress from the v0.1 build."
      description="These updates summarize the current state of the playable foundation without replacing the repository changelog."
    >
      <div className="marketing-section-grid">
        <article className="marketing-info-card">
          <span className="marketing-status">Latest</span>
          <h2>Sprint 4 closed</h2>
          <p>
            Map validation, water rejection, restricted zones, overlap checks,
            dynamic spacing, validated suggestions, and border previews are now
            accepted for the v0.1 foundation.
          </p>
        </article>
        <article className="marketing-info-card">
          <span className="marketing-status">UI polish</span>
          <h2>Public landing refresh</h2>
          <p>
            The public site now uses the Mamalik fantasy direction with a
            kingdom-led hero, clear navigation, and focused public information
            pages.
          </p>
        </article>
        <article className="marketing-info-card">
          <span className="marketing-status">Next</span>
          <h2>Sprint 5 begins combat</h2>
          <p>
            The next gameplay sprint moves into movement, scouting, attack
            orders, battle resolution, and combat reports.
          </p>
        </article>
      </div>
    </MarketingInfoPage>
  );
}
