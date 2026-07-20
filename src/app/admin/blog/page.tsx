import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Plus, ChevronRight } from "lucide-react";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { postStatus, type BlogPostStatus } from "@/lib/blog";
import { formatDate } from "@/lib/format-date";

export const metadata: Metadata = { title: "Admin · Blog" };

function fmt(iso: string | null): string {
  return iso ? formatDate(iso) : "";
}

function chip(status: BlogPostStatus, publishedAt: string | null): { label: string; cls: string } {
  if (status === "published")
    return { label: `Published ${fmt(publishedAt)}`, cls: "bg-green-100 text-green-800" };
  if (status === "scheduled")
    return { label: `Scheduled for ${fmt(publishedAt)}`, cls: "bg-amber-100 text-amber-800" };
  return { label: "Draft", cls: "bg-bg-band text-[#3a4a5a]" };
}

export default async function AdminBlogPage() {
  const { supabase } = await requireAdmin();

  // Graceful degradation: before the blog_posts migration runs in prod this
  // select errors — show the empty state, never crash the admin.
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, published, published_at, updated_at")
    .order("created_at", { ascending: false });
  const posts = data ?? [];

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[920px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <AdminNav active="blog" />

        <div className="mt-6 flex items-center justify-between">
          <p className="text-[15px] text-muted">
            {posts.length} post{posts.length === 1 ? "" : "s"} · drafts and scheduled posts are only
            visible here.
          </p>
          <Link
            href="/admin/blog/new"
            className="inline-flex items-center gap-2 rounded-[10px] bg-orange px-4 py-2 text-[14px] font-semibold text-white hover:bg-orange-dark"
          >
            <Plus className="h-[18px] w-[18px]" /> New post
          </Link>
        </div>

        <div className="mt-4 rounded-card border border-line bg-white shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-9 w-9 text-muted" />
              <p className="mt-3 text-[14px] text-muted">
                No posts yet. Write the first one — paste markdown and hit publish.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[14px]">
                <thead>
                  <tr className="border-b border-line text-[12px] uppercase tracking-wide text-muted">
                    <th className="px-5 py-3 font-bold">Post</th>
                    <th className="px-3 py-3 font-bold">Status</th>
                    <th className="px-3 py-3 font-bold">Updated</th>
                    <th className="px-3 py-3 font-bold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {posts.map((p) => {
                    const status = postStatus({
                      published: p.published,
                      publishedAt: p.published_at,
                    });
                    const c = chip(status, p.published_at);
                    return (
                      <tr key={p.id} className="hover:bg-bg-soft">
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/blog/${p.id}`}
                            className="font-semibold text-navy hover:underline"
                          >
                            {p.title || "Untitled post"}
                          </Link>
                          <div className="font-mono text-[12px] text-muted">/blog/{p.slug}</div>
                        </td>
                        <td className="px-3 py-3">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[12px] font-semibold ${c.cls}`}>
                            {c.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-ink">{fmt(p.updated_at)}</td>
                        <td className="px-3 py-3 text-right">
                          <Link
                            href={`/admin/blog/${p.id}`}
                            className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange hover:underline"
                          >
                            Edit <ChevronRight className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
