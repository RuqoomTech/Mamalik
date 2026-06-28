import type { Metadata } from "next";
import { MarketingInfoPage } from "@/components/marketing/MarketingChrome";

const contactEmail = "Omar.aglan91@gmail.com";

export const metadata: Metadata = {
  title: "Contact | Mamalik",
  description: "Contact the Mamalik project owner.",
};

export default function ContactPage() {
  return (
    <MarketingInfoPage
      active="contact"
      eyebrow="Contact"
      title="Reach the Mamalik project owner."
      description="Use this contact for account, privacy, project, and early access questions while the v0.1 game loop is being built."
    >
      <article className="marketing-info-card">
        <h2>Email</h2>
        <p>
          Contact{" "}
          <a className="font-semibold text-[#07513f] underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </article>
    </MarketingInfoPage>
  );
}
