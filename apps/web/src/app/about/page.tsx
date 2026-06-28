import type { Metadata } from "next";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "About | Mamalik",
  description: "About Mamalik, an original browser strategy MMO.",
};

export default function AboutPage() {
  return (
    <MarketingInfoPage
      active="about"
      eyebrow="About Mamalik"
      title="An original grand strategy MMO for the browser."
      description="Mamalik is a persistent strategy game about building a kingdom on a real-world map, managing land and districts, and preparing for a living multiplayer world."
    >
      <div className="marketing-section-grid">
        <article className="marketing-info-card">
          <h2>Original direction</h2>
          <p>
            Mamalik is inspired by the broad tick-based strategy genre, but it
            does not copy code, UI, art, branding, or protected expression from
            another game.
          </p>
        </article>
        <article className="marketing-info-card">
          <h2>Real map, virtual land</h2>
          <p>
            The world uses real map coordinates, but kingdom land is virtual
            game territory. Visible borders and gameplay land credit stay
            separate for balance and clarity.
          </p>
        </article>
        <article className="marketing-info-card">
          <h2>Small verified releases</h2>
          <p>
            v0.1 is built sprint by sprint. Each system is documented, tested,
            and kept inside scope before the next layer is added.
          </p>
        </article>
      </div>
    </MarketingInfoPage>
  );
}
