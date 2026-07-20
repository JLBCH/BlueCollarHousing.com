"use server";

import { revalidatePath } from "next/cache";
import { adminAction } from "@/lib/admin";
import { slugify } from "@/lib/listings/slug";
import { uniqueSlug } from "@/lib/blog";

export type SaveResult =
  | { ok: true; id: string; slug: string }
  | { ok: false; error: string };
type Result = { ok: boolean; error?: string };

/**
 * What the save should do to the post's visibility:
 * - draft:    unpublish (or save a new post as a draft)
 * - now:      publish immediately (published_at = now)
 * - schedule: publish at `scheduledAt` (future published_at; RLS hides it
 *             until then — see the blog_posts migration)
 * - keep:     save content edits without touching the publish state
 */
export type PublishMode = "draft" | "now" | "schedule" | "keep";

function revalidateBlog(slugs: (string | null | undefined)[], id?: string) {
  revalidatePath("/blog");
  for (const s of slugs) if (s) revalidatePath(`/blog/${s}`);
  revalidatePath("/admin/blog");
  if (id) revalidatePath(`/admin/blog/${id}`);
}

/** Create or update a post. Slug collisions get a -2/-3/… suffix. */
export async function savePost(input: {
  id?: string;
  title: string;
  slug?: string;
  excerpt?: string;
  coverImage?: string;
  bodyMd: string;
  mode: PublishMode;
  /** ISO timestamp (the editor converts its datetime-local value). */
  scheduledAt?: string;
}): Promise<SaveResult> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { supabase } = ctx;

  const title = input.title.trim();
  if (!title) return { ok: false, error: "Give the post a title first." };

  // Visibility columns. "keep" leaves them untouched on an existing post.
  const visibility: Record<string, unknown> = {};
  if (input.mode === "draft" || (input.mode === "keep" && !input.id)) {
    visibility.published = false;
    visibility.published_at = null;
  } else if (input.mode === "now") {
    visibility.published = true;
    visibility.published_at = new Date().toISOString();
  } else if (input.mode === "schedule") {
    const ms = Date.parse(input.scheduledAt ?? "");
    if (Number.isNaN(ms)) return { ok: false, error: "Pick a date and time to schedule." };
    visibility.published = true;
    visibility.published_at = new Date(ms).toISOString();
  }

  // Slug: from the field if given, else from the title; suffix -2, -3, … when
  // another post already owns it.
  const base = slugify(input.slug?.trim() || title);
  const { data: siblings } = await supabase
    .from("blog_posts")
    .select("id, slug")
    .like("slug", `${base}%`);
  const taken = (siblings ?? []).filter((s) => s.id !== input.id).map((s) => s.slug);
  const slug = uniqueSlug(base, taken);

  const patch = {
    title,
    slug,
    excerpt: input.excerpt?.trim() || null,
    cover_image: input.coverImage?.trim() || null,
    body_md: input.bodyMd,
    updated_at: new Date().toISOString(),
    ...visibility,
  };

  if (input.id) {
    // Old slug so the previous public URL revalidates too when it changes.
    const { data: prev } = await supabase
      .from("blog_posts")
      .select("slug")
      .eq("id", input.id)
      .maybeSingle();
    if (!prev) return { ok: false, error: "Could not find that post." };

    const { error } = await supabase.from("blog_posts").update(patch).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidateBlog([slug, prev.slug], input.id);
    return { ok: true, id: input.id, slug };
  }

  const { data: created, error } = await supabase
    .from("blog_posts")
    .insert(patch)
    .select("id")
    .single();
  if (error || !created) return { ok: false, error: error?.message || "Could not save the post." };
  revalidateBlog([slug], created.id);
  return { ok: true, id: created.id, slug };
}

/** Permanently delete a post (the editor confirms inline first). */
export async function deletePost(id: string): Promise<Result> {
  const ctx = await adminAction();
  if (!ctx.ok) return { ok: false, error: ctx.error };
  const { supabase } = ctx;

  const { data: prev } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("blog_posts").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidateBlog([prev?.slug], id);
  return { ok: true };
}
