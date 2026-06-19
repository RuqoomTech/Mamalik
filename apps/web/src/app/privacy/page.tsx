import type { Metadata } from "next";
import { LegalPageLayout, LegalSection } from "@/components/legal/LegalPageLayout";

const contactEmail = "Omar.aglan91@gmail.com";

export const metadata: Metadata = {
  title: "Privacy Policy | Mamalik",
  description: "Privacy Policy for Mamalik / ممالك.",
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      subtitle="This page explains what Mamalik collects, why it is used, and how Google sign-in data is handled."
      title="Privacy Policy"
    >
      <LegalSection title="Effective Date">
        <p>June 19, 2026</p>
      </LegalSection>

      <LegalSection title="About Mamalik">
        <p>
          Mamalik / ممالك is a browser-based strategy MMO where players create
          and manage virtual kingdoms on a real-world map. The game is in early
          v0.1 development.
        </p>
      </LegalSection>

      <LegalSection title="Account Data We Collect">
        <p>Mamalik collects account data needed to create and protect accounts:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Email address.</li>
          <li>Display name.</li>
          <li>Google account identifier when you sign in with Google.</li>
          <li>Authentication and session data, including signed login cookies.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Gameplay Data We Collect">
        <p>Mamalik stores gameplay data needed to run the game:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Kingdom name.</li>
          <li>Selected kingdom location coordinates.</li>
          <li>Virtual land, resources, buildings, units, and reports.</li>
          <li>Rankings and alliance-related game records when those v0.1 systems are added.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Why We Use Data">
        <p>We use Mamalik data for these app purposes:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Account login and account creation.</li>
          <li>Saving game progress and kingdom state.</li>
          <li>Kingdom creation and location validation.</li>
          <li>Security, abuse prevention, debugging, and admin inspection.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Google User Data">
        <p>
          If you sign in with Google, Mamalik uses your Google email, display
          name, and Google account identifier only for sign-in, account creation,
          and account linking. Mamalik does not sell Google user data, does not
          use it for ads, and does not share it except as needed to operate the
          app.
        </p>
      </LegalSection>

      <LegalSection title="Storage And Cookies">
        <p>
          Mamalik stores account and gameplay records in the app database.
          Mamalik uses a signed session cookie named <code>mamalik_session</code>{" "}
          to keep users signed in. The session cookie is used only for login and
          authenticated app access.
        </p>
      </LegalSection>

      <LegalSection title="User Choices">
        <p>
          You can contact the app owner to request account or data deletion.
          Some records may need to be retained temporarily when required for
          security, abuse investigation, debugging, or legal compliance.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          For privacy questions or deletion requests, contact{" "}
          <a className="font-semibold text-[#183f35] underline" href={`mailto:${contactEmail}`}>
            {contactEmail}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  );
}
