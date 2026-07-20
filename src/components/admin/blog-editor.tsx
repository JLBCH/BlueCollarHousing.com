"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Save,
  Send,
  CalendarClock,
  Undo2,
  Trash2,
  Loader2,
  ExternalLink,
  ImageUp,
} from "lucide-react";
import { savePost, deletePost, type PublishMode } from "@/app/admin/blog/actions";
import { postStatus, type BlogPost } from "@/lib/blog";
import { slugify } from "@/lib/listings/slug";
import { uploadBlogImage, insertImageMarkdown } from "@/lib/blog-image-upload";
import { Markdown } from "@/components/blog/markdown";

const input =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-navy/40";
const label = "mb-1 block text-[12px] font-semibold uppercase tracking-wide text-muted";
const btn =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-2 text-[13px] font-semibold text-navy hover:border-navy/40 disabled:opacity-50";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg bg-orange px-3 py-2 text-[13px] font-semibold text-white hover:bg-orange-dark disabled:opacity-50";

/** ISO timestamp → the local "yyyy-MM-ddTHH:mm" a datetime-local input wants. */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Shared editor for /admin/blog/new and /admin/blog/[id]: metadata fields, a
 * markdown textarea and a live preview (side-by-side on desktop, tabbed on
 * mobile). Made for pasting AI-written markdown and hitting Publish.
 */
export function BlogEditor({ post }: { post?: BlogPost }) {
  const router = useRouter();
  const status = post
    ? postStatus({ published: post.published, publishedAt: post.publishedAt })
    : "draft";

  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  // Once the admin touches the slug (or the post exists), stop auto-deriving
  // it from the title so a published URL never silently changes.
  const [slugEdited, setSlugEdited] = useState(Boolean(post));
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? "");
  const [coverImage, setCoverImage] = useState(post?.coverImage ?? "");
  const [bodyMd, setBodyMd] = useState(post?.bodyMd ?? "");

  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(
    status === "scheduled" && post?.publishedAt ? toLocalInput(post.publishedAt) : "",
  );
  const [tab, setTab] = useState<"write" | "preview">("write");
  // Wall-clock times render only after mount: the server (UTC on Vercel) and
  // the admin's browser disagree on local time, which would hydration-mismatch
  // and briefly show the wrong hour.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Direct image uploads (Joe would rather attach a file than paste a URL).
  const [coverUploading, setCoverUploading] = useState(false);
  const [bodyUploading, setBodyUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const bodyInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  async function handleCoverFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setCoverUploading(true);
    try {
      setCoverImage(await uploadBlogImage(file));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the image.");
    } finally {
      setCoverUploading(false);
      if (coverInputRef.current) coverInputRef.current.value = "";
    }
  }

  async function handleBodyFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    setBodyUploading(true);
    try {
      const url = await uploadBlogImage(file);
      const alt = file.name.replace(/\.[^.]+$/, "");
      // Insert at the cursor (or append) rather than clobbering the draft.
      const el = bodyRef.current;
      const at = el ? el.selectionStart : bodyMd.length;
      const end = el ? el.selectionEnd : bodyMd.length;
      const { text, cursor } = insertImageMarkdown(bodyMd, at, end, alt, url);
      setBodyMd(text);
      // Restore focus + place the cursor after the inserted image markdown.
      requestAnimationFrame(() => {
        el?.focus();
        el?.setSelectionRange(cursor, cursor);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not upload the image.");
    } finally {
      setBodyUploading(false);
      if (bodyInputRef.current) bodyInputRef.current.value = "";
    }
  }

  function save(mode: PublishMode) {
    setError(null);
    setSuccess(null);
    let scheduledIso: string | undefined;
    if (mode === "schedule") {
      if (!scheduledAt) {
        setError("Pick a date and time to schedule.");
        return;
      }
      scheduledIso = new Date(scheduledAt).toISOString();
    }
    start(async () => {
      const res = await savePost({
        id: post?.id,
        title,
        slug,
        excerpt,
        coverImage,
        bodyMd,
        mode,
        scheduledAt: scheduledIso,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setShowSchedule(false);
      setSlug(res.slug);
      setSlugEdited(true);
      if (!post) {
        // New post now exists — move to its edit URL so further saves update it.
        router.replace(`/admin/blog/${res.id}`);
        return;
      }
      const msg: Record<PublishMode, string> = {
        draft: "Saved as draft — not visible on the site.",
        now: "Published — it's live on the blog.",
        schedule: "Scheduled — it will appear on the blog at that time.",
        keep: "Saved.",
      };
      setSuccess(msg[mode]);
      router.refresh();
    });
  }

  function remove() {
    if (!post) return;
    setError(null);
    start(async () => {
      const res = await deletePost(post.id);
      if (!res.ok) {
        setError(res.error || "Could not delete the post.");
        return;
      }
      router.push("/admin/blog");
      router.refresh();
    });
  }

  const statusChip = {
    draft: { label: "Draft", cls: "bg-bg-band text-[#3a4a5a]" },
    scheduled: { label: "Scheduled", cls: "bg-amber-100 text-amber-800" },
    published: { label: "Published", cls: "bg-green-100 text-green-800" },
  }[status];

  return (
    <div className="mt-6 grid gap-5">
      {/* Metadata */}
      <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-[18px] font-bold text-navy">
            {post ? "Edit post" : "New post"}
          </h2>
          <span className="flex items-center gap-2">
            <span className={`rounded-full px-2.5 py-1 text-[12px] font-semibold ${statusChip.cls}`}>
              {statusChip.label}
            </span>
            {status === "published" && (
              <Link
                href={`/blog/${post!.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 text-[13px] font-semibold text-orange hover:underline"
              >
                View <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </span>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={label}>Title</label>
            <input
              className={input}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugEdited) setSlug(slugify(e.target.value));
              }}
              placeholder="How to find housing near a turnaround"
            />
          </div>
          <div>
            <label className={label}>Slug (URL)</label>
            <input
              className={`${input} font-mono text-[13px]`}
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugEdited(true);
              }}
              placeholder="how-to-find-housing"
            />
            <p className="mt-1 text-[12px] text-muted">bluecollarhousing.com/blog/{slug || "…"}</p>
          </div>
          <div>
            <label className={label}>Cover image (optional)</label>
            <div className="flex gap-2">
              <input
                className={input}
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder="Upload a photo, or paste an image URL"
              />
              <button
                type="button"
                disabled={coverUploading}
                onClick={() => coverInputRef.current?.click()}
                className={`${btn} shrink-0`}
              >
                {coverUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImageUp className="h-3.5 w-3.5" />
                )}
                Upload
              </button>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleCoverFile(e.target.files?.[0])}
              />
            </div>
            {coverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverImage}
                alt=""
                className="mt-2 h-24 w-full rounded-lg border border-line object-cover"
              />
            )}
          </div>
          <div className="sm:col-span-2">
            <label className={label}>Excerpt (optional — shows on the blog index + search engines)</label>
            <textarea
              className={`${input} min-h-[64px]`}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="One or two sentences summarizing the post."
            />
          </div>
        </div>
      </div>

      {/* Markdown + live preview */}
      <div className="rounded-card border border-line bg-white p-5 shadow-[0_8px_24px_rgba(16,32,48,0.06)]">
        {/* Mobile tab switch; desktop shows both panes side by side. */}
        <div className="flex gap-1 border-b border-line lg:hidden">
          {(["write", "preview"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 px-4 py-2 text-[14px] font-semibold capitalize ${
                tab === t ? "border-orange text-navy" : "border-transparent text-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-2">
          <div className={tab === "write" ? "" : "hidden lg:block"}>
            <div className="mb-1 flex items-center justify-between">
              <label className={`${label} mb-0 hidden lg:block`}>Markdown</label>
              <button
                type="button"
                disabled={bodyUploading}
                onClick={() => bodyInputRef.current?.click()}
                className={`${btn} ml-auto py-1.5 text-[12px]`}
                title="Upload an image and insert it where your cursor is"
              >
                {bodyUploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ImageUp className="h-3.5 w-3.5" />
                )}
                Insert image
              </button>
              <input
                ref={bodyInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleBodyFile(e.target.files?.[0])}
              />
            </div>
            <textarea
              ref={bodyRef}
              className={`${input} min-h-[420px] font-mono text-[13px] leading-relaxed`}
              value={bodyMd}
              onChange={(e) => setBodyMd(e.target.value)}
              placeholder={"# Heading\n\nPaste your markdown here…"}
            />
          </div>
          <div className={tab === "preview" ? "" : "hidden lg:block"}>
            <p className={`${label} hidden lg:block`}>Preview</p>
            <div className="min-h-[420px] rounded-lg border border-line bg-bg-soft/50 p-5">
              {title && (
                <h1 className="font-display mb-4 text-[26px] font-bold leading-tight text-navy">
                  {title}
                </h1>
              )}
              {bodyMd ? (
                <Markdown>{bodyMd}</Markdown>
              ) : (
                <p className="text-[14px] text-muted">The preview appears here as you type.</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          {status === "draft" ? (
            <button type="button" disabled={pending} onClick={() => save("draft")} className={btn}>
              <Save className="h-3.5 w-3.5" /> Save draft
            </button>
          ) : (
            <button type="button" disabled={pending} onClick={() => save("keep")} className={btn}>
              <Save className="h-3.5 w-3.5" /> Save changes
            </button>
          )}

          {status !== "published" && (
            <button type="button" disabled={pending} onClick={() => save("now")} className={primaryBtn}>
              <Send className="h-3.5 w-3.5" /> Publish now
            </button>
          )}

          {!showSchedule && status !== "published" && (
            <button type="button" disabled={pending} onClick={() => setShowSchedule(true)} className={btn}>
              <CalendarClock className="h-3.5 w-3.5" />
              {status === "scheduled" ? "Reschedule" : "Schedule"}
            </button>
          )}

          {(status === "published" || status === "scheduled") && (
            <button type="button" disabled={pending} onClick={() => save("draft")} className={btn}>
              <Undo2 className="h-3.5 w-3.5" /> Unpublish
            </button>
          )}

          {post &&
            /* Inline confirm — window.confirm() is silently blocked in some
               Android in-app browsers / installed PWAs. */
            (confirmDelete ? (
              <span className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12px] font-semibold text-red-700">
                Delete this post for good?
                <button type="button" disabled={pending} onClick={remove} className="underline hover:no-underline">
                  Yes, delete
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => setConfirmDelete(false)}
                  className="text-navy underline hover:no-underline"
                >
                  Cancel
                </button>
              </span>
            ) : (
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmDelete(true)}
                className={`${btn} text-red-600 hover:border-red-300`}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            ))}

          {pending && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
        </div>

        {showSchedule && (
          <div className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-bg-soft p-3">
            <div>
              <label className={label}>Goes live at</label>
              <input
                type="datetime-local"
                className={input}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
            </div>
            <button type="button" disabled={pending} onClick={() => save("schedule")} className={primaryBtn}>
              <CalendarClock className="h-3.5 w-3.5" /> Schedule post
            </button>
            <button type="button" disabled={pending} onClick={() => setShowSchedule(false)} className={btn}>
              Cancel
            </button>
          </div>
        )}

        {status === "scheduled" && post?.publishedAt && !showSchedule && mounted && (
          <p className="mt-3 text-[13px] text-muted">
            Scheduled to go live{" "}
            {new Date(post.publishedAt).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
            . The public page can take up to 5 minutes after that to show it.
          </p>
        )}

        {error && <p className="mt-3 text-[13px] font-medium text-red-600">{error}</p>}
        {success && <p className="mt-3 text-[13px] font-medium text-green-700">{success}</p>}
      </div>
    </div>
  );
}
