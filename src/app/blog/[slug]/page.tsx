import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Markdown } from "@/components/blog/markdown";
import { getPostBySlug } from "@/lib/blog";
import { formatDate } from "@/lib/format-date";

// Re-check every 5 minutes so edits and scheduled publishes go live
// without a redeploy.
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const post = await getPostBySlug((await params).slug);
  if (!post) return { title: "Post not found" };
  const description = post.excerpt || post.bodyMd.replace(/[#*_>`[\]]/g, "").slice(0, 155);
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      type: "article",
      ...(post.coverImage ? { images: [{ url: post.coverImage }] } : {}),
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const post = await getPostBySlug((await params).slug);
  if (!post) notFound();

  const date = post.publishedAt
    ? formatDate(post.publishedAt, { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <section className="py-12 sm:py-16">
      <Container className="max-w-[760px]">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-orange"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>

        <header className="mt-6">
          {date && (
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-orange">
              {date}
            </p>
          )}
          <h1 className="font-display mt-3 text-[34px] font-bold leading-tight text-navy sm:text-[42px]">
            {post.title}
          </h1>
          {post.excerpt && (
            <p className="mt-3 text-[17px] leading-relaxed text-muted">{post.excerpt}</p>
          )}
        </header>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt=""
            className="mt-8 w-full rounded-card border border-line object-cover"
          />
        )}

        <article className="mt-8">
          <Markdown>{post.bodyMd}</Markdown>
        </article>

        <div className="mt-12 border-t border-line pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-navy hover:text-orange"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all posts
          </Link>
        </div>
      </Container>
    </section>
  );
}
