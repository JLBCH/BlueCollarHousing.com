import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Keep private/landlord areas and auth callbacks out of the index.
      disallow: ["/dashboard", "/admin", "/login", "/register", "/reset-password", "/forgot-password", "/auth/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
