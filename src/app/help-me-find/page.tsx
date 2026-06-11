import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Help Me Find a Place" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Help Me Find a Place"
      note="Tell us where the job is and we will help you find housing nearby. Coming soon."
    />
  );
}
