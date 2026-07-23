import type { Metadata } from "next";
import { LegalDoc } from "@/components/legal-doc";
import { TOU, TOU_INTRO, TOU_LAST_UPDATED } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "BlueCollarHousing.com platform terms of use and property owner listing agreement.",
};

export default function TermsPage() {
  return (
    <LegalDoc
      title="Platform Terms of Use and Property Owner Listing Agreement"
      lastUpdated={TOU_LAST_UPDATED}
      intro={TOU_INTRO}
      sections={TOU}
    />
  );
}
