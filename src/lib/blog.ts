import { createPublicClient } from "@/lib/supabase/public";

/**
 * Data-access layer for blog posts.
 *
 * Reads published posts from Supabase via the public (anon) client — RLS only
 * exposes rows with published = true and a published_at in the past, so a
 * scheduled post (future published_at) stays hidden until its time arrives.
 *
 * Every reader falls back to []/null on ANY failure (network, missing table,
 * …) so /blog keeps rendering its empty state until the blog_posts migration
 * is applied in production. Nothing here may throw.
 */

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  bodyMd: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body_md?: string;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

function mapRow(r: BlogPostRow): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt,
    bodyMd: r.body_md ?? "",
    coverImage: r.cover_image,
    published: r.published,
    publishedAt: r.published_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

// No published/date filters here on purpose: the anon client's RLS policy
// already enforces published = true AND published_at <= now(), and embedding
// new Date() in the query made every call's URL unique — which defeated
// Next's per-request fetch memoization (generateMetadata + page = 2 fetches).

/** Everything a list view needs — body_md deliberately excluded so the /blog
 *  index and sitemap don't transfer every post's full markdown. */
const LIST_COLUMNS =
  "id, slug, title, excerpt, cover_image, published, published_at, created_at, updated_at";

/** All published (live) posts, newest first, WITHOUT bodies. [] on any error. */
export async function getPublishedPosts(): Promise<BlogPost[]> {
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("blog_posts")
      .select(LIST_COLUMNS)
      .order("published_at", { ascending: false });
    if (error || !data) return [];
    return (data as BlogPostRow[]).map(mapRow);
  } catch {
    return [];
  }
}

/** A single live post by slug, or null. RLS hides drafts + scheduled posts. */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const sb = createPublicClient();
    const { data, error } = await sb
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapRow(data as BlogPostRow);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Pure helpers (shared by the admin UI + server actions; unit-tested).
// ---------------------------------------------------------------------------

export type BlogPostStatus = "draft" | "scheduled" | "published";

/**
 * Draft / scheduled / published from the two columns. Mirrors the RLS rule:
 * a post is public only when published = true AND published_at <= now(), so a
 * future published_at means "scheduled". published = true without a date
 * should never happen (the actions always set both) — treated as draft since
 * that's exactly what RLS makes it: invisible.
 */
export function postStatus(
  p: { published: boolean; publishedAt: string | null },
  now: Date = new Date(),
): BlogPostStatus {
  if (!p.published || !p.publishedAt) return "draft";
  return new Date(p.publishedAt).getTime() > now.getTime() ? "scheduled" : "published";
}

/** First free slug: base, then base-2, base-3, … given the taken set. */
export function uniqueSlug(base: string, taken: Iterable<string>): string {
  const set = new Set(taken);
  if (!set.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!set.has(candidate)) return candidate;
  }
}
