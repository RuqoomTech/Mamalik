import type { Metadata } from "next";
import Link from "next/link";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

export const metadata: Metadata = {
  title: "Careers | Mamalik",
  description: "Careers and collaboration notes for Mamalik.",
};

export default function CareersPage() {
  return (
    <MarketingInfoPage
      active="careers"
      eyebrow="Careers"
      title="Mamalik is not hiring yet."
      description="The project is still focused on completing the v0.1 game loop. Future collaboration needs will be shared when the product direction and production needs are clearer."
    >
      <article className="marketing-info-card">
        <h2>Future roles</h2>
        <p>
          Future needs may include game design, map data operations, frontend
          polish, backend reliability, community operations, and visual asset
          production.
        </p>
        <p>
          For now, use the{" "}
          <Link className="font-semibold text-[#07513f] underline" href="/contact">
            contact page
          </Link>{" "}
          for serious project questions.
        </p>
      </article>
    </MarketingInfoPage>
  );
}
