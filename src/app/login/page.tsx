import type { Metadata } from "next";
import { PagePlaceholder } from "@/components/page-placeholder";

export const metadata: Metadata = { title: "Log In" };

export default function Page() {
  return (
    <PagePlaceholder
      title="Log In"
      note="Account sign in and registration are coming soon."
    />
  );
}
