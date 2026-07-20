import { createClient } from "@/lib/supabase/client";

/** Supabase Storage bucket for blog cover + inline images (admin-write, public-read). */
export const BLOG_BUCKET = "blog-images";
const MAX_DIM = 1600; // longest edge — plenty for a blog cover / in-body figure

/**
 * Downscale + re-encode to JPEG in the browser so a phone photo doesn't upload
 * at full resolution. Mirrors the listing PhotoUploader's resize step.
 */
function resize(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = document.createElement("img");
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = () => {
        const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("no canvas"));
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("encode failed"))),
          "image/jpeg",
          0.85,
        );
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Resize `file`, upload it to the blog-images bucket under the admin's own
 * folder ({uid}/{ts}.jpg), and return its public URL. Throws with a
 * human-readable message on failure so callers can surface it.
 */
export async function uploadBlogImage(file: File): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Please sign in again to upload an image.");

  const blob = await resize(file);
  const path = `${user.id}/${Date.now()}-${Math.round(blob.size)}.jpg`;
  const { error } = await supabase.storage
    .from(BLOG_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: false });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BLOG_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Splice an image markdown snippet into `body` at the [start, end) selection,
 * ensuring it starts on its own line, and report where the cursor should land
 * (just past the inserted snippet). Pure so the cursor math is unit-tested.
 */
export function insertImageMarkdown(
  body: string,
  start: number,
  end: number,
  alt: string,
  url: string,
): { text: string; cursor: number } {
  const snippet = `![${alt}](${url})`;
  const before = body.slice(0, start);
  const after = body.slice(end);
  const lead = before && !before.endsWith("\n") ? "\n" : "";
  const text = `${before}${lead}${snippet}\n${after}`;
  return { text, cursor: before.length + lead.length + snippet.length + 1 };
}
