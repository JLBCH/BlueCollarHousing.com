import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/admin";
import { AdminNav } from "@/components/admin/admin-nav";
import { BlogEditor } from "@/components/admin/blog-editor";

export const metadata: Metadata = { title: "Admin · New post" };

export default async function AdminNewPostPage() {
  await requireAdmin();

  return (
    <section className="min-h-[calc(100vh-92px)] bg-bg-soft py-10">
      <Container className="max-w-[1180px]">
        <h1 className="font-display text-[30px] font-bold text-navy sm:text-[36px]">Admin</h1>
        <AdminNav active="blog" />
        <BlogEditor />
      </Container>
    </section>
  );
}
