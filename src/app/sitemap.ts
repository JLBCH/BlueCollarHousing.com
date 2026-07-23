import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";
import { getListings } from "@/lib/listings";
import { groupCities } from "@/lib/listings/cities";
import { getPublishedPosts } from "@/lib/blog";

/** XML sitemap: static marketing/worker pages + every approved listing. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPaths = [
    "",
    "/search",
    "/help-me-find",
    "/worker-faq",
    "/landlords",
    "/landlord-faq",
    "/list-your-property",
    "/contact",
    "/blog",
    "/housing",
    "/terms",
    "/privacy",
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${SITE_URL}${p}`,
    changeFrequency: p === "/search" || p === "" ? "daily" : "weekly",
    priority: p === "" ? 1 : 0.7,
  }));

  // Both readers catch internally and return [] on any failure, so a data
  // hiccup still yields a valid static-only sitemap. Cities derive from the
  // listings already in hand — one parallel round of fetching, no re-query.
  const [listings, posts] = await Promise.all([getListings(), getPublishedPosts()]);

  const listingEntries: MetadataRoute.Sitemap = listings.map((l) => ({
    url: `${SITE_URL}/listings/${l.slug}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const cityEntries: MetadataRoute.Sitemap = groupCities(listings).map((c) => ({
    url: `${SITE_URL}/housing/${c.slug}`,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const postEntries: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${SITE_URL}/blog/${p.slug}`,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...cityEntries, ...listingEntries, ...postEntries];
}
