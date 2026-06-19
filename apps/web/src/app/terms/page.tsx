import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

const contactEmail = "Omar.aglan91@gmail.com";

export const metadata: Metadata = {
  title: "Terms of Service | Mamalik",
  description: "Terms of Service for Mamalik / ممالك.",
};

export default function TermsPage() {
  return (
    <LegalPageLayout
      subtitle="These terms describe the basic rules for using the Mamalik v0.1 strategy game."
      title="Terms of Service"
    >
      <LegalSection title="Effective Date">
        <p>June 19, 2026</p>
      </LegalSection>

      <LegalSection title="About The Game">
        <p>
          Mamalik / ممالك is a virtual browser-based strategy game. Kingdoms,
          land, resources, buildings, units, reports, rankings, and alliances are
          game systems only.
        </p>
      </LegalSection>

      <LegalSection title="Virtual Land And Assets">
        <p>
          Virtual land in Mamalik is not real land ownership. No real-world land,
          property right, or real-money ownership of virtual assets is granted in
          v0.1. Google login is only an authentication method and does not create
          any ownership right in the game.
        </p>
      </LegalSection>

      <LegalSection title="Account Responsibility">
        <p>
          You are responsible for keeping your account secure. Do not share
          passwords, attempt to access another account, or use another Google
          account without permission.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable Use">
        <p>Users must not abuse or disrupt Mamalik. This includes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Attacking, exploiting, spamming, scraping, or disrupting the service.</li>
          <li>Trying to bypass authentication, authorization, or game rules.</li>
          <li>Uploading or submitting harmful, illegal, or abusive content.</li>
          <li>Using automation or vulnerabilities to gain unfair advantage.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Development Status">
        <p>
          Mamalik is in early development. Features, rules, formulas, data
          structures, and user interface details may change. During early
          versions, the game may reset or change if needed for testing,
          balancing, security, or technical repair.
        </p>
      </LegalSection>

      <LegalSection title="Moderation And Administration">
        <p>
          Mamalik admins may moderate accounts, restrict access, or inspect app
          records when needed to operate the game, investigate abuse, debug
          issues, or protect the service. Sprint 1 admin tools are read-only, but
          later v0.1 admin operations may add controlled moderation tools.
        </p>
      </LegalSection>

      <LegalSection title="Availability">
        <p>
          Mamalik may be unavailable during development, maintenance, deployment,
          or unexpected failures. The app is provided as an early game service
          without a promise that it will be uninterrupted or error-free.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For terms or account questions, contact{" "}
          <a className="font-semibold text-[#183f35] underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
