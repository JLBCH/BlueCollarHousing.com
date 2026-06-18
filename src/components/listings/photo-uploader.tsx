"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImageUp, Loader2, Star, X, ArrowLeft, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

const BUCKET = "listing-photos";
const MAX_DIM = 1600; // longest edge after resize
const MAX_PHOTOS = 12;

type Photo = { url: string; path: string };

/** Downscale + re-encode to JPEG so phones on slow connections upload fast. */
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
          0.82,
        );
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoUploader({
  value,
  onChange,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const [photos, setPhotos] = useState<Photo[]>(value.map((url) => ({ url, path: "" })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draftId = useRef<string>(crypto.randomUUID());
  const inputRef = useRef<HTMLInputElement>(null);

  function commit(next: Photo[]) {
    setPhotos(next);
    onChange(next.map((p) => p.url));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return setError("Please sign in again to upload photos.");

    const room = MAX_PHOTOS - photos.length;
    const chosen = Array.from(files).slice(0, Math.max(0, room));
    if (chosen.length === 0) return setError(`You can add up to ${MAX_PHOTOS} photos.`);

    setBusy(true);
    const added: Photo[] = [];
    for (const file of chosen) {
      try {
        const blob = await resize(file);
        const path = `${user.id}/${draftId.current}/${Date.now()}-${added.length}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: "image/jpeg", upsert: false });
        if (upErr) {
          setError(upErr.message);
          continue;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        added.push({ url: data.publicUrl, path });
      } catch {
        setError("One of the images could not be processed.");
      }
    }
    commit([...photos, ...added]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function remove(i: number) {
    const p = photos[i];
    if (p.path) {
      const supabase = createClient();
      await supabase.storage.from(BUCKET).remove([p.path]);
    }
    commit(photos.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[i], next[j]] = [next[j], next[i]];
    commit(next);
  }

  function makeCover(i: number) {
    if (i === 0) return;
    const next = [...photos];
    const [p] = next.splice(i, 1);
    next.unshift(p);
    commit(next);
  }

  return (
    <div className="grid gap-3">
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center rounded-card border border-dashed border-line bg-bg-soft py-9 text-center"
      >
        <ImageUp className="h-8 w-8 text-muted" />
        <p className="mt-2 text-[14px] text-muted">
          Drag photos here, or{" "}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="font-semibold text-orange hover:underline"
          >
            browse
          </button>
        </p>
        <p className="mt-1 text-[12.5px] text-muted">
          At least 3 recommended. The first photo is your cover. Up to {MAX_PHOTOS}.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {error && <p className="text-[13px] font-medium text-red-600">{error}</p>}
      {busy && (
        <p className="flex items-center gap-2 text-[13px] text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Uploading...
        </p>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((p, i) => (
            <div key={p.url} className="group relative overflow-hidden rounded-lg border border-line">
              <div className="relative aspect-[4/3] bg-bg-band">
                <Image src={p.url} alt="" fill sizes="200px" className="object-cover" />
              </div>
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded bg-orange px-1.5 py-0.5 text-[11px] font-bold text-white">
                  Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/45 px-1.5 py-1">
                <div className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-white disabled:opacity-30 hover:bg-white/20" aria-label="Move left">
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="rounded p-1 text-white disabled:opacity-30 hover:bg-white/20" aria-label="Move right">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  {i !== 0 && (
                    <button type="button" onClick={() => makeCover(i)} className="rounded p-1 text-white hover:bg-white/20" aria-label="Make cover">
                      <Star className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button type="button" onClick={() => remove(i)} className="rounded p-1 text-white hover:bg-white/20" aria-label="Delete">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
