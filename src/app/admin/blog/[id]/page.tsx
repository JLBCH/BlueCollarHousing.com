import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { BlogEditor } from "@/components/admin/blog-editor";
import type { BlogPost } from "@/lib/blog";

export const metadata: Metadata = { title: "Admin · Edit post" };

export default async function AdminEditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  const { data } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();

  const post: BlogPost = {
    id: data.id,
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt,
    bodyMd: data.body_md,
    coverImage: data.cover_image,
    published: data.published,
    publishedAt: data.published_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[1180px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <AdminNav active="blog" />
        <BlogEditor post={post} />
      </Container>
    </section>
  );
}
