import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";
import { PRIVACY, PRIVACY_INTRO, PRIVACY_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How BlueCollarHousing.com collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <LegalDoc
      title="Privacy Policy"
      lastUpdated={PRIVACY_LAST_UPDATED}
      intro={PRIVACY_INTRO}
      sections={PRIVACY}
    />
  );
}
