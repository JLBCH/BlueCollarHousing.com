import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { getPublishedPosts, type BlogPost } from "@/lib/blog";
import { formatDate } from "@/lib/format-date";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "News, guides and housing tips for blue-collar workers and landlords.",
};

// Re-check every 5 minutes so newly published / scheduled posts appear
// without a redeploy.
export const revalidate = 300;

function postDate(p: BlogPost): string {
  if (!p.publishedAt) return "";
  return formatDate(p.publishedAt, { month: "long", day: "numeric", year: "numeric" });
}

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <section className="py-16 sm:py-24">
      <Container className="max-w-[760px]">
        <div className="text-center">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
            Blog
          </p>
          <h1 className="font-display mt-3 text-[40px] font-bold text-navy sm:text-[48px]">
            Guides and housing tips
          </h1>
        </div>

        {posts.length === 0 ? (
          <div className="mt-10 flex flex-col items-center rounded-card border border-dashed border-line bg-bg-soft px-6 py-16 text-center">
            <Newspaper className="h-11 w-11 text-muted" />
            <h2 className="font-display mt-4 text-[24px] font-bold text-navy">
              No posts yet
            </h2>
            <p className="mx-auto mt-2 max-w-[44ch] text-[15px] text-muted">
              We are putting together guides on finding housing near the job,
              refinery and turnaround tips, and advice for landlords. Check back
              soon.
            </p>
            <Button href="/search" variant="navy" className="mt-6">
              Find housing in the meantime
            </Button>
          </div>
        ) : (
          <div className="mt-10 grid gap-5">
            {posts.map((p) => (
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="group overflow-hidden rounded-card border border-line bg-white shadow-[0_8px_24px_rgba(16,32,48,0.06)] transition hover:border-navy/30"
              >
                {p.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.coverImage}
                    alt=""
                    loading="lazy"
                    className="h-[220px] w-full object-cover"
                  />
                )}
                <div className="p-6">
                  <p className="text-[13px] font-medium text-muted">{postDate(p)}</p>
                  <h2 className="font-display mt-1.5 text-[22px] font-bold text-navy group-hover:text-orange sm:text-[24px]">
                    {p.title}
                  </h2>
                  {p.excerpt && (
                    <p className="mt-2 text-[15px] leading-relaxed text-[#3a4a5a]">
                      {p.excerpt}
                    </p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[14px] font-semibold text-orange">
                    Read post <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}
