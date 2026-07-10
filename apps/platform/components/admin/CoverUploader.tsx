"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buttonVariants } from "@/components/ui/Button";

type Props = {
  postId: string;
  hasCover: boolean;
  labels: {
    upload: string;
    replace: string;
    uploading: string;
    done: string;
    error: string;
  };
};

type Status = "idle" | "uploading" | "done" | "error";

// Covers render at 1200x630 and must stay small — social scrapers reject
// og:images over ~5 MB, and raw AI-tool exports easily hit 6-8 MB. Anything
// over the threshold is downscaled and re-encoded to WebP in the browser
// (the Workers runtime can't run image codecs server-side).
const COMPRESS_OVER_BYTES = 500 * 1024;
const MAX_WIDTH = 1600;

async function compressImage(file: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_WIDTH / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    // Browsers without WebP encoding fall back to PNG; either way, only
    // use the result if it actually came out smaller than the original.
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;
  }
}

/** Single-shot cover upload (images are small; no multipart needed). */
export function CoverUploader({ postId, hasCover, labels }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const router = useRouter();

  async function handleFile(file: File) {
    setStatus("uploading");
    try {
      const body =
        file.size > COMPRESS_OVER_BYTES ? await compressImage(file) : file;
      const response = await fetch(
        `/api/admin/blog-cover?postId=${encodeURIComponent(postId)}`,
        {
          method: "POST",
          headers: { "content-type": body.type },
          body,
        },
      );
      if (!response.ok) throw new Error(String(response.status));
      setStatus("done");
      router.refresh();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        disabled={status === "uploading"}
        onClick={() => inputRef.current?.click()}
        className={buttonVariants("secondary", "md")}
      >
        {status === "uploading"
          ? labels.uploading
          : hasCover
            ? labels.replace
            : labels.upload}
      </button>
      {status === "done" ? (
        <span className="text-sm font-semibold text-emerald-700">{labels.done}</span>
      ) : null}
      {status === "error" ? (
        <span className="text-sm font-semibold text-red-700">{labels.error}</span>
      ) : null}
    </div>
  );
}
