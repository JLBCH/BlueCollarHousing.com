import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Terms & Privacy" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Terms & Privacy"
      note="Terms of use and privacy policy. Content arriving soon."
    />
  );
}
